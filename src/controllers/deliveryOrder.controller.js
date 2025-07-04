import { PrismaClient } from "@prisma/client";
import { createDeliveryOrderSchema } from "../utils/deliveryOrder.validation.js";

const prisma = new PrismaClient();

// Get all
export const getAllDeliveryOrder = async (req, res) => {
  try {
    const deliveryOrders = await prisma.delivery_Order.findMany({
      include: {
        material_request: {
          select: {
            id: true,
            no_mr: true,
            status: true,
          },
        },
      },
    });
    res.status(200).json({ success: true, data: deliveryOrders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get by ID
export const getDeliveryOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const deliveryOrder = await prisma.delivery_Order.findUnique({
      where: { id },
      include: {
        material_request: {
          select: {
            id: true,
            no_mr: true,
            status: true,
            location: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        items: {
          include: {
            material_request_item: {
              select: {
                id: true,
                quantity: true,
                status: true,
                item: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    part_number: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!deliveryOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Data tidak ditemukan" });
    }

    // Format ulang items
    const formattedItems = deliveryOrder.items.map((doItem) => {
      const mri = doItem.material_request_item;
      return {
        id: doItem.id,
        quantity: doItem.quantity,
        material_request_item_id: mri.id,
        material_request_item_quantity: mri.quantity,
        status: mri.status,
        item: mri.item,
      };
    });

    const responseData = {
      id: deliveryOrder.id,
      no_do: deliveryOrder.no_do,
      status: deliveryOrder.status,
      remarks: deliveryOrder.remarks,
      created_at: deliveryOrder.created_at,
      material_request: deliveryOrder.material_request,
      items: formattedItems,
    };

    return res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    console.error("[GET DO BY ID]", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Create
export const createDeliveryOrder = async (req, res) => {
  try {
    // 1. Validasi input dengan Zod
    const parsed = createDeliveryOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Data yang dikirim tidak valid",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { remarks, material_request_id, items } = parsed.data;

    // 2. Cek apakah Material Request ada
    const materialRequest = await prisma.material_Request.findUnique({
      where: { id: material_request_id },
      select: {
        id: true,
        no_mr: true,
        status: true,
        created_by: {
          select: { email: true },
        },
        location: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    if (!materialRequest) {
      return res.status(404).json({
        success: false,
        message: "Material Request tidak ditemukan",
        error_code: "MATERIAL_REQUEST_NOT_FOUND",
      });
    }

    // 3. Validasi status Material Request (jika diperlukan)
    if (materialRequest.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message:
          "Tidak dapat membuat Delivery Order untuk Material Request yang sudah dibatalkan",
        details: {
          material_request_no: materialRequest.no_mr,
          current_status: materialRequest.status,
        },
      });
    }

    // 4. Validasi: semua material_request_item_id harus sudah ada di Purchase_Order_Item
    const allMrItemIds = items.map((it) => it.material_request_item_id);
    // Cari di Purchase_Order_Item mana saja yang memiliki material_request_item_id sesuai list
    const poItems = await prisma.purchase_Order_Item.findMany({
      where: {
        material_request_item_id: { in: allMrItemIds },
      },
      select: { material_request_item_id: true },
    });

    const poItemIdSet = new Set(poItems.map((p) => p.material_request_item_id));
    // Temukan ID yang tidak ada di PO
    const invalidIds = allMrItemIds.filter((id) => !poItemIdSet.has(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Ada material_request_item_id yang belum terdaftar di Purchase Order",
        invalid_ids: invalidIds,
        error_code: "MR_ITEM_NOT_IN_PO",
      });
    }

    // 5. Generate nomor DO baru
    const lastDO = await prisma.delivery_Order.findFirst({
      orderBy: { created_at: "desc" },
    });

    let newNoDo = "DO-001";
    if (lastDO && lastDO.no_do) {
      const parts = lastDO.no_do.split("-");
      const lastNumber = parseInt(parts[1], 10);
      if (!isNaN(lastNumber)) {
        const newNumber = lastNumber + 1;
        newNoDo = `DO-${String(newNumber).padStart(3, "0")}`;
      }
    }

    // 6. Buat Delivery Order dan items secara transaksi
    const newDO = await prisma.delivery_Order.create({
      data: {
        no_do: newNoDo,
        status: "pending",
        remarks,
        material_request_id,
        items: {
          create: items.map((item) => ({
            material_request_item_id: item.material_request_item_id,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            material_request_item: {
              include: {
                item: {
                  select: {
                    name: true,
                    code: true,
                    part_number: true,
                  },
                },
              },
            },
          },
        },
        material_request: {
          select: {
            no_mr: true,
            status: true,
            created_by: {
              select: {
                email: true,
              },
            },
            location: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    // 7. Kirim respons sukses
    return res.status(201).json({
      success: true,
      message: "Delivery Order berhasil dibuat",
      data: {
        delivery_order: newDO,
        summary: {
          no_do: newDO.no_do,
          material_request_no: newDO.material_request.no_mr,
          requestor_email: newDO.material_request.created_by.email,
          location: newDO.material_request.location.name,
          total_items: newDO.items.length,
          status: newDO.status,
        },
      },
    });
  } catch (error) {
    console.error("Error saat membuat Delivery Order:", error);

    // 8. Tangani error Prisma khusus
    if (error.code === "P2002") {
      const constraintField = error.meta?.target?.[0];
      return res.status(409).json({
        success: false,
        message: "Data duplikat terdeteksi",
        error_code: "DUPLICATE_DATA",
        details: `Constraint gagal pada field: ${constraintField}`,
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Data terkait tidak ditemukan",
        error_code: "RELATED_DATA_NOT_FOUND",
      });
    }

    // 9. Generic server error
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
      error_code: "INTERNAL_SERVER_ERROR",
    });
  }
};

// Approval
export const approveDeliveryOrder = async (req, res) => {
  const { id } = req.params; // ID Delivery Order
  const userId = req.user.id;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Hanya admin yang dapat memberikan approval",
      });
    }

    const deliveryOrder = await prisma.delivery_Order.findUnique({
      where: { id },
      include: { approvals: true },
    });

    if (!deliveryOrder) {
      return res.status(404).json({
        success: false,
        message: "Delivery Order tidak ditemukan",
      });
    }

    const sudahApprove = deliveryOrder.approvals.some((u) => u.id === userId);
    if (sudahApprove) {
      return res.status(400).json({
        success: false,
        message: "Anda sudah memberikan approval untuk DO ini",
      });
    }

    // Tambahkan approval
    await prisma.delivery_Order.update({
      where: { id },
      data: {
        approvals: {
          connect: { id: userId },
        },
      },
    });

    const updatedDO = await prisma.delivery_Order.findUnique({
      where: { id },
      include: {
        approvals: true,
        items: {
          include: {
            material_request_item: {
              include: {
                material_request: true,
              },
            },
          },
        },
      },
    });

    const totalApprovals = updatedDO.approvals.length;

    // Jika sudah 4 approval, ubah status dan update MR
    if (totalApprovals >= 4 && updatedDO.status !== "approved") {
      await prisma.delivery_Order.update({
        where: { id },
        data: { status: "approved" },
      });

      const mr_id =
        updatedDO.items[0]?.material_request_item?.material_request?.id;

      let updatedMR = null;

      if (mr_id) {
        const mr = await prisma.material_Request.findUnique({
          where: { id: mr_id },
          include: { items: true },
        });

        const totalMRItemIds = mr?.items.map((item) => item.id) || [];

        const approvedDOItems = await prisma.delivery_Order_Item.findMany({
          where: {
            material_request_item: {
              material_request_id: mr_id,
            },
            delivery_order: {
              status: "approved",
            },
          },
          select: {
            material_request_item_id: true,
          },
        });

        const approvedItemIds = new Set(
          approvedDOItems.map((item) => item.material_request_item_id)
        );

        const isAllCovered = totalMRItemIds.every((id) =>
          approvedItemIds.has(id)
        );

        const newMRStatus = isAllCovered ? "done" : "partial_done";

        updatedMR = await prisma.material_Request.update({
          where: { id: mr_id },
          data: {
            status: newMRStatus,
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: "Approval berhasil ditambahkan dan DO disetujui",
        data: {
          approvals_count: totalApprovals,
          do_status: "approved",
          related_mr_status: updatedMR?.status || null,
        },
      });
    }

    // Jika belum 4 approval
    return res.status(200).json({
      success: true,
      message: "Approval berhasil ditambahkan",
      data: {
        approvals_count: totalApprovals,
        remaining_approvals: 4 - totalApprovals,
      },
    });
  } catch (error) {
    console.error("Gagal menyimpan approval:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat menyimpan approval",
      error: error.message,
    });
  }
};

export const getDeliveryOrderApprovals = async (req, res) => {
  const { id } = req.params; // ID Delivery Order

  try {
    const deliveryOrder = await prisma.delivery_Order.findUnique({
      where: { id },
      include: {
        approvals: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!deliveryOrder) {
      return res.status(404).json({
        success: false,
        message: "Delivery Order tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Data approval DO berhasil didapatkan",
      data: {
        approvals: deliveryOrder.approvals,
      },
    });
  } catch (error) {
    console.error("Gagal mendapatkan data approval DO:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mendapatkan data approval DO",
      error: error.message,
    });
  }
};
