import { PrismaClient } from "@prisma/client";
import { purchaseOrderSchema } from "../utils/purchaseOrder.validation.js";

const prisma = new PrismaClient();

// Get all purchase orders
export const getAllPurchaseOrders = async (req, res) => {
  try {
    const orders = await prisma.purchase_Order.findMany({
      orderBy: { created_at: "desc" },
      include: {
        created_by: {
          select: {
            id: true,
            email: true,
          },
        },
        material_requests: {
          select: {
            id: true,
            no_mr: true,
          },
        },
      },
    });

    // Format data agar hanya field yang dibutuhkan yang dikirim
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      no_po: order.no_po,
      status: order.status,
      created_at: order.created_at,
      user: order.created_by,
      material_requests: order.material_requests, // Bisa lebih dari 1
    }));

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil data list purchase order",
      data: formattedOrders,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data list purchase order",
      error: err.message,
    });
  }
};

// Get purchase order by id
export const getPurchaseOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await prisma.purchase_Order.findUnique({
      where: { id },
      include: {
        created_by: {
          select: {
            id: true,
            email: true,
          },
        },
        material_requests: {
          select: {
            id: true,
            no_mr: true,
          },
        },
        items: {
          include: {
            material_request_item: {
              select: {
                id: true,
                item: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Purchase Order tidak ditemukan",
      });
    }

    const formattedItems = order.items.map((item) => ({
      id: item.id,
      supplier: item.supplier,
      quantity: item.quantity,
      price: item.price,
      status: item.status,
      purchase_order_id: item.purchase_order_id,
      material_request_item_id: item.material_request_item_id,
      material_request_item: item.material_request_item, // berisi id dan item { id, name }
    }));

    const responseData = {
      id: order.id,
      no_po: order.no_po,
      status: order.status,
      created_at: order.created_at,
      user: order.created_by,
      material_requests: order.material_requests,
      items: formattedItems,
    };

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil data purchase order",
      data: responseData,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data purchase order",
      error: err.message,
    });
  }
};

// Get purchase order by created_by
export const getPurchaseOrdersByUser = async (req, res) => {
  const { user_id } = req.params; // Menggunakan user_id sesuai dengan parameter route
  try {
    const orders = await prisma.purchase_Order.findMany({
      where: { created_by_id: user_id }, // Menggunakan created_by_id, bukan created_by
      orderBy: { created_at: "desc" },
      include: {
        items: true,
        created_by: true, // Opsional: mengikutsertakan data user yang membuat PO
        material_requests: true, // Opsional: mengikutsertakan material requests terkait
      },
    });

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil data list purchase order",
      data: orders,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data list purchase order",
      error: err.message,
    });
  }
};

// Create new purchase order
export const createPurchaseOrder = async (req, res) => {
  try {
    const data = purchaseOrderSchema.parse(req.body);
    const { items, created_by, material_request_ids, ...otherData } = data;

    const lastPo = await prisma.purchase_Order.findFirst({
      orderBy: { no_po: "desc" },
    });

    let newNoPo = "PO-001";
    if (lastPo && lastPo.no_po) {
      const lastNumber = parseInt(lastPo.no_po.split("-")[1]);
      const newNumber = lastNumber + 1;
      newNoPo = `PO-${String(newNumber).padStart(3, "0")}`;
    }

    const createdByUser = await prisma.user.findUnique({
      where: { id: created_by },
    });

    if (!createdByUser) {
      return res.status(400).json({
        success: false,
        message: "Gagal membuat Purchase Order",
        errors: [`User dengan ID ${created_by} tidak ditemukan.`],
      });
    }

    if (material_request_ids && material_request_ids.length > 0) {
      for (const mrId of material_request_ids) {
        const mrExists = await prisma.material_Request.findUnique({
          where: { id: mrId },
        });

        if (!mrExists) {
          return res.status(400).json({
            success: false,
            message: "Gagal membuat Purchase Order",
            errors: [`Material Request dengan ID ${mrId} tidak ditemukan.`],
          });
        }
      }
    }

    const createdPo = await prisma.$transaction(async (tx) => {
      const po = await tx.purchase_Order.create({
        data: {
          no_po: newNoPo,
          created_by_id: created_by,
          status: otherData.status ?? "draft",
        },
      });

      const mrIdSet = new Set();

      for (const item of items) {
        const materialRequestItemExists =
          await tx.material_Request_Item.findUnique({
            where: { id: item.material_request_item_id },
            include: { material_request: true },
          });

        if (!materialRequestItemExists) {
          throw new Error(
            `Material Request Item dengan ID ${item.material_request_item_id} tidak ditemukan.`
          );
        }

        if (materialRequestItemExists.material_request_id) {
          mrIdSet.add(materialRequestItemExists.material_request_id);
        }

        if (materialRequestItemExists.status !== "pending") {
          throw new Error(
            `Material Request Item dengan ID ${item.material_request_item_id} tidak dapat digunakan karena status-nya adalah '${materialRequestItemExists.status}'. Hanya item dengan status 'pending' yang dapat digunakan.`
          );
        }

        const poItemStatus = item.status ?? "proses";

        await tx.purchase_Order_Item.create({
          data: {
            purchase_order_id: po.id,
            material_request_item_id: item.material_request_item_id,
            supplier: item.supplier,
            quantity: item.quantity,
            price: item.price !== undefined ? item.price : null,
            status: poItemStatus,
          },
        });

        if (poItemStatus === "proses") {
          await tx.material_Request_Item.update({
            where: { id: item.material_request_item_id },
            data: { status: "proses" },
          });
        }
      }

      for (const mrId of mrIdSet) {
        const mrItems = await tx.material_Request_Item.findMany({
          where: { material_request_id: mrId },
        });

        if (mrItems.length === 0) continue;

        const allPending = mrItems.every((item) => item.status === "pending");
        const allDone = mrItems.every((item) => item.status === "done");
        const hasDone = mrItems.some((item) => item.status === "done");
        const hasProses = mrItems.some((item) => item.status === "proses");

        let newMrStatus;

        if (allDone) {
          newMrStatus = "done";
        } else if (hasDone) {
          newMrStatus = "partial done";
        } else if (hasProses) {
          newMrStatus = "proses";
        } else if (allPending) {
          newMrStatus = "pending";
        } else {
          newMrStatus = "proses";
        }

        await tx.material_Request.update({
          where: { id: mrId },
          data: {
            status: newMrStatus,
            purchase_order_id: po.id,
          },
        });
      }

      if (material_request_ids && material_request_ids.length > 0) {
        for (const mrId of material_request_ids) {
          if (!mrIdSet.has(mrId)) {
            await tx.material_Request.update({
              where: { id: mrId },
              data: { purchase_order_id: po.id },
            });
          }
        }
      }

      return await tx.purchase_Order.findUnique({
        where: { id: po.id },
        include: {
          items: true,
          material_requests: true,
        },
      });
    });

    res.status(201).json({
      success: true,
      message: "Purchase Order berhasil dibuat",
      data: createdPo,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validasi gagal",
        errors: error.errors.map((e) => e.message),
      });
    }

    if (error.code === "P2003") {
      const field = error.meta?.field_name || "unknown";
      let errorMessage = "Data referensi tidak ditemukan";

      if (field.includes("created_by_id")) {
        errorMessage = "Pembuat tidak ditemukan di database";
      }

      return res.status(404).json({
        success: false,
        message: errorMessage,
        error: `Data dengan ${field} tidak terdaftar di database`,
      });
    }

    if (error.code === "P2002") {
      const field = error.meta?.target || "unknown";
      return res.status(409).json({
        success: false,
        message: `Terjadi duplikasi data pada field ${field}`,
        error: `Data dengan ${field} tersebut sudah ada di database`,
      });
    }

    console.error("Error creating purchase order:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat membuat Purchase Order",
      error: error.message,
    });
  }
};

// Update purchase order with complete functionality
export const updatePurchaseOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const data = purchaseOrderSchema.partial().parse(req.body);
    const { items, created_by, material_request_ids, ...otherData } = data;

    // Check if purchase order exists
    const existingPo = await prisma.purchase_Order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            material_request_item: {
              include: {
                material_request: true,
              },
            },
          },
        },
        material_requests: true,
        igr: true, // Check if IGR already exists
      },
    });

    if (!existingPo) {
      return res.status(404).json({
        success: false,
        message: "Purchase Order tidak ditemukan",
      });
    }

    // Prevent update if IGR already exists
    if (existingPo.igr) {
      return res.status(400).json({
        success: false,
        message:
          "Purchase Order tidak dapat diupdate karena sudah memiliki Incoming Good Receipt",
        errors: ["PO yang sudah memiliki IGR tidak dapat dimodifikasi"],
      });
    }

    // Validate created_by if provided
    if (created_by) {
      const createdByUser = await prisma.user.findUnique({
        where: { id: created_by },
      });

      if (!createdByUser) {
        return res.status(400).json({
          success: false,
          message: "Gagal mengupdate Purchase Order",
          errors: [`User dengan ID ${created_by} tidak ditemukan.`],
        });
      }
    }

    // Validate material_request_ids if provided
    if (material_request_ids && material_request_ids.length > 0) {
      for (const mrId of material_request_ids) {
        const mrExists = await prisma.material_Request.findUnique({
          where: { id: mrId },
        });

        if (!mrExists) {
          return res.status(400).json({
            success: false,
            message: "Gagal mengupdate Purchase Order",
            errors: [`Material Request dengan ID ${mrId} tidak ditemukan.`],
          });
        }
      }
    }

    const updatedPo = await prisma.$transaction(async (tx) => {
      // Update basic PO data
      const po = await tx.purchase_Order.update({
        where: { id },
        data: {
          ...(created_by && { created_by_id: created_by }),
          ...otherData,
        },
      });

      // Handle items update if provided
      if (items && Array.isArray(items)) {
        // Get existing PO items to track changes
        const existingItems = existingPo.items;
        const existingItemIds = existingItems.map((item) => item.id);
        const updatedItemIds = items
          .filter((item) => item.id)
          .map((item) => item.id);

        // Items to delete (existing items not in updated items)
        const itemsToDelete = existingItemIds.filter(
          (itemId) => !updatedItemIds.includes(itemId)
        );

        // Delete removed items and revert their MR item status
        for (const itemId of itemsToDelete) {
          const itemToDelete = existingItems.find((item) => item.id === itemId);

          // Revert material request item status to pending
          await tx.material_Request_Item.update({
            where: { id: itemToDelete.material_request_item_id },
            data: { status: "pending" },
          });

          await tx.purchase_Order_Item.delete({
            where: { id: itemId },
          });
        }

        const mrIdSet = new Set();

        // Process each item (create new or update existing)
        for (const item of items) {
          // Validate material request item
          const materialRequestItemExists =
            await tx.material_Request_Item.findUnique({
              where: { id: item.material_request_item_id },
              include: { material_request: true },
            });

          if (!materialRequestItemExists) {
            throw new Error(
              `Material Request Item dengan ID ${item.material_request_item_id} tidak ditemukan.`
            );
          }

          // Collect MR IDs for status update
          if (materialRequestItemExists.material_request_id) {
            mrIdSet.add(materialRequestItemExists.material_request_id);
          }

          // Check if this is an update or create
          if (item.id) {
            // Update existing item
            const existingItem = existingItems.find((ei) => ei.id === item.id);

            // If material_request_item_id changed, revert old one and validate new one
            if (
              existingItem &&
              existingItem.material_request_item_id !==
                item.material_request_item_id
            ) {
              // Revert old material request item status
              await tx.material_Request_Item.update({
                where: { id: existingItem.material_request_item_id },
                data: { status: "pending" },
              });

              // Validate new material request item status
              if (materialRequestItemExists.status !== "pending") {
                throw new Error(
                  `Material Request Item dengan ID ${item.material_request_item_id} tidak dapat digunakan karena status-nya adalah '${materialRequestItemExists.status}'. Hanya item dengan status 'pending' yang dapat digunakan.`
                );
              }
            }

            const poItemStatus = item.status ?? "proses";

            await tx.purchase_Order_Item.update({
              where: { id: item.id },
              data: {
                material_request_item_id: item.material_request_item_id,
                supplier: item.supplier,
                quantity: item.quantity,
                price: item.price !== undefined ? item.price : null,
                status: poItemStatus,
              },
            });

            // Update material request item status
            if (poItemStatus === "proses") {
              await tx.material_Request_Item.update({
                where: { id: item.material_request_item_id },
                data: { status: "proses" },
              });
            }
          } else {
            // Create new item
            if (materialRequestItemExists.status !== "pending") {
              throw new Error(
                `Material Request Item dengan ID ${item.material_request_item_id} tidak dapat digunakan karena status-nya adalah '${materialRequestItemExists.status}'. Hanya item dengan status 'pending' yang dapat digunakan.`
              );
            }

            const poItemStatus = item.status ?? "proses";

            await tx.purchase_Order_Item.create({
              data: {
                purchase_order_id: po.id,
                material_request_item_id: item.material_request_item_id,
                supplier: item.supplier,
                quantity: item.quantity,
                price: item.price !== undefined ? item.price : null,
                status: poItemStatus,
              },
            });

            if (poItemStatus === "proses") {
              await tx.material_Request_Item.update({
                where: { id: item.material_request_item_id },
                data: { status: "proses" },
              });
            }
          }
        }

        // Update material request statuses based on their items
        for (const mrId of mrIdSet) {
          const mrItems = await tx.material_Request_Item.findMany({
            where: { material_request_id: mrId },
          });

          if (mrItems.length === 0) continue;

          const allPending = mrItems.every((item) => item.status === "pending");
          const allDone = mrItems.every((item) => item.status === "done");
          const hasDone = mrItems.some((item) => item.status === "done");
          const hasProses = mrItems.some((item) => item.status === "proses");

          let newMrStatus;

          if (allDone) {
            newMrStatus = "done";
          } else if (hasDone) {
            newMrStatus = "partial done";
          } else if (hasProses) {
            newMrStatus = "proses";
          } else if (allPending) {
            newMrStatus = "pending";
          } else {
            newMrStatus = "proses";
          }

          await tx.material_Request.update({
            where: { id: mrId },
            data: {
              status: newMrStatus,
              purchase_order_id: po.id,
            },
          });
        }

        // Handle material request items that are no longer associated
        const currentMrIds = Array.from(mrIdSet);
        const previousMrIds = existingPo.material_requests.map((mr) => mr.id);
        const removedMrIds = previousMrIds.filter(
          (mrId) => !currentMrIds.includes(mrId)
        );

        // Update status of removed material requests
        for (const mrId of removedMrIds) {
          const mrItems = await tx.material_Request_Item.findMany({
            where: { material_request_id: mrId },
          });

          const allPending = mrItems.every((item) => item.status === "pending");
          const allDone = mrItems.every((item) => item.status === "done");
          const hasDone = mrItems.some((item) => item.status === "done");
          const hasProses = mrItems.some((item) => item.status === "proses");

          let newMrStatus;

          if (allDone) {
            newMrStatus = "done";
          } else if (hasDone) {
            newMrStatus = "partial done";
          } else if (hasProses) {
            newMrStatus = "proses";
          } else if (allPending) {
            newMrStatus = "pending";
          } else {
            newMrStatus = "proses";
          }

          await tx.material_Request.update({
            where: { id: mrId },
            data: {
              status: newMrStatus,
              purchase_order_id: null, // Remove association
            },
          });
        }
      }

      // Handle additional material_request_ids if provided
      if (material_request_ids && material_request_ids.length > 0) {
        // Remove existing associations not in the new list
        const currentAssociatedMrIds = existingPo.material_requests.map(
          (mr) => mr.id
        );
        const toRemove = currentAssociatedMrIds.filter(
          (mrId) => !material_request_ids.includes(mrId)
        );

        for (const mrId of toRemove) {
          await tx.material_Request.update({
            where: { id: mrId },
            data: { purchase_order_id: null },
          });
        }

        // Add new associations
        for (const mrId of material_request_ids) {
          await tx.material_Request.update({
            where: { id: mrId },
            data: { purchase_order_id: po.id },
          });
        }
      }

      // Return updated PO with all relations
      return await tx.purchase_Order.findUnique({
        where: { id: po.id },
        include: {
          items: {
            include: {
              material_request_item: {
                include: {
                  item: true,
                  material_request: true,
                },
              },
            },
          },
          material_requests: {
            include: {
              items: true,
              location: true,
            },
          },
          created_by: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });
    });

    res.status(200).json({
      success: true,
      message: "Purchase Order berhasil diperbarui",
      data: updatedPo,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validasi gagal",
        errors: error.errors.map((e) => e.message),
      });
    }

    if (error.code === "P2003") {
      const field = error.meta?.field_name || "unknown";
      let errorMessage = "Data referensi tidak ditemukan";

      if (field.includes("created_by_id")) {
        errorMessage = "Pembuat tidak ditemukan di database";
      } else if (field.includes("material_request_item_id")) {
        errorMessage = "Material Request Item tidak ditemukan di database";
      }

      return res.status(404).json({
        success: false,
        message: errorMessage,
        error: `Data dengan ${field} tidak terdaftar di database`,
      });
    }

    if (error.code === "P2002") {
      const field = error.meta?.target || "unknown";
      return res.status(409).json({
        success: false,
        message: `Terjadi duplikasi data pada field ${field}`,
        error: `Data dengan ${field} tersebut sudah ada di database`,
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Data tidak ditemukan",
        error: "Record yang akan diupdate tidak ditemukan di database",
      });
    }

    console.error("Error updating purchase order:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengupdate Purchase Order",
      error: error.message,
    });
  }
};

// Delete purchase order
export const deletePurchaseOrder = async (req, res) => {
  const { id } = req.params; // ID purchase order yang akan dihapus

  try {
    // Cek apakah PO ada
    const existingPO = await prisma.purchase_Order.findUnique({
      where: { id },
      include: {
        igr: true, // Cek apakah ada IGR yang terkait
        items: true,
      },
    });

    if (!existingPO) {
      return res.status(404).json({
        success: false,
        message: "Purchase Order tidak ditemukan",
      });
    }

    // Gunakan transaction untuk memastikan konsistensi data
    await prisma.$transaction(async (tx) => {
      // 1. Jika ada IGR yang terkait, hapus IGR items terlebih dahulu
      if (existingPO.igr) {
        await tx.incoming_Good_Receipt_Item.deleteMany({
          where: {
            igr_id: existingPO.igr.id,
          },
        });

        // 2. Hapus IGR
        await tx.incoming_Good_Receipt.delete({
          where: {
            id: existingPO.igr.id,
          },
        });
      }

      // 3. Hapus semua Purchase Order Items
      await tx.purchase_Order_Item.deleteMany({
        where: {
          purchase_order_id: id,
        },
      });

      // 4. Update Material Request yang terkait - reset purchase_order_id ke null
      await tx.material_Request.updateMany({
        where: {
          purchase_order_id: id,
        },
        data: {
          purchase_order_id: null,
          status: "pending", // reset status ke pending karena PO dihapus
        },
      });

      // 5. Reset status Material Request Items yang terkait dengan PO items
      for (const poItem of existingPO.items) {
        await tx.material_Request_Item.update({
          where: {
            id: poItem.material_request_item_id,
          },
          data: {
            status: "pending", // reset ke pending karena PO dihapus
          },
        });
      }

      // 6. Hapus relasi approval (many-to-many)
      await tx.purchase_Order.update({
        where: { id },
        data: {
          approvals: {
            set: [], // hapus semua relasi approval
          },
        },
      });

      // 7. Hapus Purchase Order itu sendiri
      await tx.purchase_Order.delete({
        where: {
          id: id,
        },
      });
    });

    res.status(200).json({
      success: true,
      message: "Purchase Order dan semua data terkait berhasil dihapus",
      data: {
        deleted_po_id: id,
        had_igr: !!existingPO.igr,
        deleted_items_count: existingPO.items.length,
      },
    });
  } catch (err) {
    console.error("Error deleting Purchase Order:", err);

    // Handle specific Prisma errors
    if (err.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Purchase Order tidak ditemukan",
      });
    }

    if (err.code === "P2003") {
      return res.status(400).json({
        success: false,
        message:
          "Tidak dapat menghapus Purchase Order karena masih memiliki referensi ke data lain",
        error: "Foreign key constraint violation",
      });
    }

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat menghapus Purchase Order",
      error: err.message,
    });
  }
};

// Approval
export const approvePurchaseOrder = async (req, res) => {
  const { id } = req.params; // purchase order ID
  const userId = req.user.id; // dari middleware auth

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Hanya admin yang dapat memberikan approval",
      });
    }

    const po = await prisma.purchase_Order.findUnique({
      where: { id },
      include: { approvals: true },
    });

    if (!po) {
      return res.status(404).json({
        success: false,
        message: "Purchase Order tidak ditemukan",
      });
    }

    const sudahApprove = po.approvals.some((u) => u.id === userId);
    if (sudahApprove) {
      return res.status(400).json({
        success: false,
        message: "Anda sudah memberikan approval untuk PO ini",
      });
    }

    // Tambahkan approval
    await prisma.purchase_Order.update({
      where: { id },
      data: {
        approvals: {
          connect: { id: userId },
        },
      },
    });

    const updatedPO = await prisma.purchase_Order.findUnique({
      where: { id },
      include: {
        approvals: true,
        items: {
          include: {
            material_request_item: {
              include: {
                item: {
                  include: {
                    shelves: {
                      take: 1, // ambil shelf pertama untuk item ini
                      orderBy: { created_at: "asc" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Jika sudah 4 approval
    if (updatedPO.approvals.length === 4) {
      // Update status PO menjadi approved
      await prisma.purchase_Order.update({
        where: { id },
        data: { status: "approved" },
      });

      // Generate nomor IGR otomatis
      const lastIGR = await prisma.incoming_Good_Receipt.findFirst({
        orderBy: { no_igr: "desc" },
      });

      let newNoIGR = "IGR-001";
      if (lastIGR && lastIGR.no_igr) {
        const lastNumber = parseInt(lastIGR.no_igr.split("-")[1]);
        const newNumber = lastNumber + 1;
        newNoIGR = `IGR-${String(newNumber).padStart(3, "0")}`;
      }

      // Persiapkan data untuk IGR items
      const igrItemsData = [];

      for (const poItem of updatedPO.items) {
        const item = poItem.material_request_item.item;

        // Cari shelf untuk item ini, atau gunakan shelf pertama jika ada
        let shelfId = null;
        if (item.shelves && item.shelves.length > 0) {
          shelfId = item.shelves[0].id;
        } else {
          // Jika tidak ada shelf untuk item ini, cari shelf kosong atau buat default
          const availableShelf = await prisma.shelf.findFirst({
            where: {
              stock_qty: 0, // shelf kosong
            },
            orderBy: { created_at: "asc" },
          });

          if (availableShelf) {
            shelfId = availableShelf.id;
            // Update shelf dengan item_id baru
            await prisma.shelf.update({
              where: { id: availableShelf.id },
              data: { item_id: item.id },
            });
          } else {
            // Jika tidak ada shelf kosong, gunakan shelf pertama yang tersedia
            const firstShelf = await prisma.shelf.findFirst({
              orderBy: { created_at: "asc" },
            });

            if (firstShelf) {
              shelfId = firstShelf.id;
            } else {
              throw new Error(
                `Tidak ada shelf yang tersedia untuk item ${item.name}`
              );
            }
          }
        }

        igrItemsData.push({
          quantity: poItem.quantity,
          status: "pending",
          item_id: item.id,
          purchase_order_item_id: poItem.id,
          shelf_id: shelfId,
        });
      }

      // Buat IGR dengan items
      const newIGR = await prisma.incoming_Good_Receipt.create({
        data: {
          no_igr: newNoIGR, // ✅ Fixed: gunakan newNoIGR bukan no_igr
          received_date: new Date(),
          purchase_order_id: id,
          items: {
            create: igrItemsData,
          },
        },
        include: {
          items: {
            include: {
              item: true,
              shelf: true,
              purchase_order_item: true,
            },
          },
        },
      });

      console.log(
        `IGR ${newNoIGR} berhasil dibuat dengan ${newIGR.items.length} items` // ✅ Fixed: gunakan newNoIGR
      );

      return res.status(200).json({
        success: true,
        message: "Approval berhasil ditambahkan dan IGR otomatis telah dibuat",
        data: {
          approvals_count: updatedPO.approvals.length,
          po_status: "approved",
          igr_created: {
            no_igr: newNoIGR, // ✅ Fixed: gunakan newNoIGR
            items_count: newIGR.items.length,
          },
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Approval berhasil ditambahkan",
      data: {
        approvals_count: updatedPO.approvals.length,
        remaining_approvals: 4 - updatedPO.approvals.length,
      },
    });
  } catch (err) {
    console.error("Error in approvePurchaseOrder:", err);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat memberikan approval",
      error: err.message,
    });
  }
};

// Get Purchase Order Approvals by PO ID
export const getPurchaseOrderApprovals = async (req, res) => {
  const { id } = req.params; // purchase order ID

  try {
    // Cek apakah PO ada
    const po = await prisma.purchase_Order.findUnique({
      where: { id },
      select: {
        id: true,
        no_po: true,
        status: true,
        created_at: true,
      },
    });

    if (!po) {
      return res.status(404).json({
        success: false,
        message: "Purchase Order tidak ditemukan",
      });
    }

    // Ambil data approval dengan detail user yang memberikan approval
    // Diurutkan berdasarkan created_at dari yang paling lama ke paling baru
    const approvals = await prisma.user.findMany({
      where: {
        approved_purchase_orders: {
          some: {
            id: id,
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        created_at: true,
      },
      orderBy: {
        created_at: "asc", // urutkan dari yang paling lama
      },
    });

    // Hitung jumlah approval yang sudah ada dan yang masih dibutuhkan
    const totalApprovals = approvals.length;
    const requiredApprovals = 4;
    const remainingApprovals = Math.max(0, requiredApprovals - totalApprovals);

    // Status approval berdasarkan jumlah approval
    let approvalStatus = "pending";
    if (totalApprovals >= requiredApprovals) {
      approvalStatus = "approved";
    } else if (totalApprovals > 0) {
      approvalStatus = "partially_approved";
    }

    res.status(200).json({
      success: true,
      message: "Data approval berhasil diambil",
      data: {
        purchase_order: {
          id: po.id,
          no_po: po.no_po,
          status: po.status,
          created_at: po.created_at,
        },
        approval_summary: {
          total_approvals: totalApprovals,
          required_approvals: requiredApprovals,
          remaining_approvals: remainingApprovals,
          approval_status: approvalStatus,
          is_fully_approved: totalApprovals >= requiredApprovals,
        },
        approvals: approvals.map((user, index) => ({
          sequence: index + 1, // urutan approval
          user_id: user.id,
          email: user.email,
          role: user.role,
          approved_date: user.created_at,
        })),
      },
    });
  } catch (err) {
    console.error("Error in getPurchaseOrderApprovals:", err);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data approval",
      error: err.message,
    });
  }
};
