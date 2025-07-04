import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { materialRequestSchema } from "../utils/materialRequest.validation.js";

const prisma = new PrismaClient();

// Get all material requests
export const getAllMaterialRequests = async (req, res) => {
  try {
    const requests = await prisma.material_Request.findMany({
      orderBy: { created_at: "desc" },
      include: {
        created_by: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // Format hasil agar hanya menampilkan field yang dibutuhkan
    const formattedRequests = requests.map((request) => ({
      id: request.id,
      no_mr: request.no_mr,
      status: request.status,
      user: request.created_by,
    }));

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil data material request",
      data: formattedRequests,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data material request",
      error: err.message,
    });
  }
};

// Get material request by ID
export const getMaterialRequestById = async (req, res) => {
  const { id } = req.params;
  try {
    const request = await prisma.material_Request.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        created_by: {
          select: {
            id: true,
            email: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Material request tidak ditemukan",
      });
    }

    const {
      created_by_id,
      purchase_order_id,
      location_id,
      created_by,
      items,
      ...rest
    } = request;

    // Transform items
    const transformedItems = items.map(
      ({ id, quantity, duration, status, item }) => ({
        id,
        quantity,
        duration,
        status,
        item, // sudah dalam bentuk { id, name }
      })
    );

    const formattedResponse = {
      ...rest,
      items: transformedItems,
      user: created_by,
    };

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil material request",
      data: formattedResponse,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan",
      error: err.message,
    });
  }
};

// Create new material request
export const createMaterialRequest = async (req, res) => {
  try {
    // Validasi input dengan Zod
    const parsed = materialRequestSchema.parse(req.body);
    const { items, created_by, ...otherData } = parsed;

    // Tetapkan status untuk setiap item menjadi 'pending' otomatis
    const itemsWithPendingStatus = items.map((item) => ({
      ...item,
      status: "pending",
    }));

    // Tentukan status akhir material request berdasarkan status item
    const allDone = itemsWithPendingStatus.every(
      (item) => item.status === "done"
    );
    const allPending = itemsWithPendingStatus.every(
      (item) => item.status === "pending"
    );
    let status = "partial";
    if (allDone) {
      status = "done";
    } else if (allPending) {
      status = "requested";
    }

    // Verifikasi location_id ada di database
    const locationExists = await prisma.location.findUnique({
      where: { id: otherData.location_id },
    });

    if (!locationExists) {
      return res.status(404).json({
        success: false,
        message: "Lokasi tidak ditemukan",
        errors: [
          `Lokasi dengan id ${otherData.location_id} tidak terdaftar di database`,
        ],
      });
    }

    // Verifikasi semua item_id ada di database
    const itemIds = itemsWithPendingStatus.map((item) => item.item_id);
    const existingItems = await prisma.item.findMany({
      where: { id: { in: itemIds } },
      select: { id: true },
    });

    const existingItemIds = existingItems.map((item) => item.id);
    const missingItemIds = itemIds.filter(
      (id) => !existingItemIds.includes(id)
    );

    if (missingItemIds.length > 0) {
      return res.status(404).json({
        success: false,
        message: "Beberapa item tidak ditemukan",
        errors: missingItemIds.map(
          (id) => `Item dengan id ${id} tidak terdaftar di database`
        ),
      });
    }

    // Ambil urutan terakhir no_mr dari database dan buat no_mr baru
    const lastMaterialRequest = await prisma.material_Request.findFirst({
      orderBy: {
        no_mr: "desc",
      },
      select: {
        no_mr: true,
      },
    });

    let newNoMr = "MR-001";
    if (lastMaterialRequest) {
      const lastNoMr = lastMaterialRequest.no_mr;
      const lastNumber = parseInt(lastNoMr.split("-")[1]);
      const newNumber = lastNumber + 1;
      newNoMr = `MR-${String(newNumber).padStart(3, "0")}`;
    }

    // Buat material request baru di database
    const newRequest = await prisma.material_Request.create({
      data: {
        no_mr: newNoMr,
        ...otherData,
        status,
        created_by_id: created_by,
        items: {
          createMany: {
            data: itemsWithPendingStatus.map((item) => ({
              item_id: item.item_id,
              quantity: item.quantity,
              duration: item.duration,
              status: item.status,
            })),
          },
        },
      },
      include: {
        items: true,
      },
    });

    // Hapus purchase_order_id dari respons sebelum dikirim ke client
    const { purchase_order_id, ...responseData } = {
      ...newRequest,
      items: newRequest.items,
    };

    res.status(201).json({
      success: true,
      message: "Material Request berhasil dibuat",
      data: responseData,
    });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validasi gagal",
        errors: err.errors.map((e) => e.message),
      });
    }

    if (err.code === "P2003") {
      const field = err.meta?.field_name || "unknown";
      let errorMessage = "Data referensi tidak ditemukan";

      if (field.includes("location_id")) {
        errorMessage = "Lokasi tidak ditemukan di database";
      } else if (field.includes("item_id")) {
        errorMessage = "Item tidak ditemukan di database";
      } else if (field.includes("created_by_id")) {
        errorMessage = "Pembuat tidak ditemukan di database";
      }

      return res.status(404).json({
        success: false,
        message: errorMessage,
        error: `Data dengan ${field} tidak terdaftar di database`,
      });
    }

    if (err.code === "P2002") {
      const field = err.meta?.target || "unknown";
      return res.status(409).json({
        success: false,
        message: `Terjadi duplikasi data pada field ${field}`,
        error: `Data dengan ${field} tersebut sudah ada di database`,
      });
    }

    console.error("Error creating material request:", err);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat membuat material request",
      error: err.message,
    });
  }
};

// Update material request
export const updateMaterialRequest = async (req, res) => {
  const id = req.params.id;

  try {
    // Validasi input dari body
    const parsedData = materialRequestSchema.parse(req.body);
    const { no_mr, location_id, created_by, remarks, items } = parsedData;

    // Cek apakah MR ada
    const existingMR = await prisma.material_Request.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingMR) {
      return res
        .status(404)
        .json({ message: "Material Request tidak ditemukan" });
    }

    // Tentukan status MR berdasarkan status item baru
    const statusList = items.map((item) => item.status || "pending");
    let finalStatus = "pending";

    const allPending = statusList.every((s) => s === "pending");
    const allDone = statusList.every((s) => s === "done");
    const hasDone = statusList.includes("done");
    const hasProses = statusList.includes("proses");

    if (allPending) {
      finalStatus = "pending";
    } else if (allDone) {
      finalStatus = "done";
    } else if (hasDone) {
      finalStatus = "partial_done";
    } else if (hasProses) {
      finalStatus = "proses";
    }

    // Update MR
    const updatedMR = await prisma.material_Request.update({
      where: { id },
      data: {
        no_mr,
        location_id,
        created_by_id: created_by,
        remarks,
        status: finalStatus,
        items: {
          deleteMany: {}, // Hapus semua item sebelumnya
          create: items.map((item) => ({
            item_id: item.item_id,
            quantity: item.quantity,
            duration: item.duration,
            status: item.status || "pending",
          })),
        },
      },
      include: {
        items: true,
        location: true,
        created_by: true,
      },
    });

    return res.status(200).json({
      message: "Material Request berhasil diperbarui",
      data: updatedMR,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validasi gagal",
        errors: error.errors,
      });
    }

    console.error("Error update MR:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat memperbarui Material Request",
    });
  }
};

// Delete material request
export const deleteMaterialRequest = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await prisma.material_Request.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Material Request tidak ditemukan",
      });
    }

    await prisma.material_Request_Item.deleteMany({
      where: { material_request_id: id },
    });

    await prisma.material_Request.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: "Material Request berhasil dihapus",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat menghapus material request",
      error: err.message,
    });
  }
};
