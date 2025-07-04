import { generateMaterialRequestPDF } from "../utils/generatePDF/generateMaterialRequestPDF.js";
import { generatePurchaseOrderPDF } from "../utils/generatePDF/generatePurchaseOrderPDF.js";
import { generateIncomingGoodReceiptPDF } from "../utils/generatePDF/generateIncomingGoodReceiptPDF.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const downloadMaterialRequestPDF = async (req, res) => {
  const { id } = req.params;
  console.log(
    `[DOWNLOAD MR PDF] Request to download material request with id: ${id}`
  );

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
                code: true,
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
      console.warn(
        `[DOWNLOAD MR PDF] Material request dengan id ${id} tidak ditemukan.`
      );
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

    const transformedItems = items.map(
      ({ id, quantity, duration, status, notes, unit, item }) => ({
        id,
        quantity,
        duration,
        status,
        notes,
        unit,
        item,
      })
    );

    const formattedData = {
      ...rest,
      items: transformedItems,
      user: created_by,
    };

    if (!formattedData.no_mr) {
      console.warn(
        "[DOWNLOAD MR PDF] Field no_mr kosong. Menggunakan ID sebagai nama file."
      );
    }

    console.log("[DOWNLOAD MR PDF] Data berhasil diambil dan akan dibuat PDF:");
    console.log({
      no_mr: formattedData.no_mr,
      lokasi: request.location?.name,
      jumlah_item: transformedItems.length,
      dibuat_oleh: created_by.email,
    });

    console.log("[DOWNLOAD MR PDF] Detail items:");
    transformedItems.forEach((it, index) => {
      console.log(`  #${index + 1}:`, {
        id: it.id,
        nama: it.item?.name,
        kode: it.item?.code,
        jumlah: it.quantity,
        durasi: it.duration,
        unit: it.unit,
        status: it.status,
        catatan: it.notes,
      });
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=material-request-${formattedData.no_mr || id}.pdf`
    );

    generateMaterialRequestPDF(formattedData, res);
  } catch (err) {
    console.error("[DOWNLOAD MR PDF] Terjadi error saat membuat PDF:", err);
    res.status(500).json({
      success: false,
      message: "Gagal membuat PDF",
      error: err.message,
    });
  }
};

export const downloadPurchaseOrderPDF = async (req, res) => {
  const { id } = req.params;
  console.log(
    `[DOWNLOAD PO PDF] Request to download purchase order with id: ${id}`
  );

  try {
    const po = await prisma.purchase_Order.findUnique({
      where: { id },
      include: {
        created_by: {
          select: {
            id: true,
            email: true,
          },
        },
        approvals: {
          select: {
            id: true,
            email: true,
          },
        },
        material_requests: {
          select: {
            id: true,
            no_mr: true,
            remarks: true,
            location: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        items: {
          select: {
            id: true,
            supplier: true,
            price: true,
            quantity: true,
            status: true,
            material_request_item: {
              select: {
                item: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!po) {
      console.warn(
        `[DOWNLOAD PO PDF] Purchase order dengan id ${id} tidak ditemukan.`
      );
      return res.status(404).json({
        success: false,
        message: "Purchase order tidak ditemukan",
      });
    }

    const { created_by, approvals, material_requests, items, ...rest } = po;

    const transformedItems = items.map(
      ({ id, supplier, price, quantity, status, material_request_item }) => ({
        id,
        supplier,
        price,
        quantity,
        status,
        item: material_request_item?.item,
      })
    );

    const formattedData = {
      ...rest,
      user: created_by,
      approvals,
      material_requests,
      items: transformedItems,
    };

    if (!formattedData.no_po) {
      console.warn(
        "[DOWNLOAD PO PDF] Field no_po kosong. Menggunakan ID sebagai nama file."
      );
    }

    console.log("[DOWNLOAD PO PDF] Data berhasil diambil dan akan dibuat PDF:");
    console.log({
      no_po: formattedData.no_po,
      jumlah_item: transformedItems.length,
      dibuat_oleh: created_by.email,
      jumlah_approval: approvals.length,
    });

    console.log("[DOWNLOAD PO PDF] Detail items:");
    transformedItems.forEach((it, index) => {
      console.log(`  #${index + 1}:`, {
        id: it.id,
        nama: it.item?.name,
        kode: it.item?.code,
        jumlah: it.quantity,
        harga: it.price,
        supplier: it.supplier,
        status: it.status,
      });
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=purchase-order-${formattedData.no_po || id}.pdf`
    );

    generatePurchaseOrderPDF(formattedData, res);
  } catch (err) {
    console.error("[DOWNLOAD PO PDF] Terjadi error saat membuat PDF:", err);
    res.status(500).json({
      success: false,
      message: "Gagal membuat PDF",
      error: err.message,
    });
  }
};

export const downloadIncomingGoodReceiptPDF = async (req, res) => {
  const { id } = req.params;

  try {
    const igr = await prisma.incoming_Good_Receipt.findUnique({
      where: { id },
      include: {
        purchase_order: {
          select: {
            no_po: true,
            created_by: {
              select: { email: true },
            },
            material_requests: {
              select: {
                location: {
                  select: { name: true },
                },
              },
              take: 1, // Ambil salah satu lokasi (diasumsikan sama)
            },
          },
        },
        items: {
          select: {
            quantity: true,
            item: {
              select: { name: true, code: true, },
            },
            purchase_order_item: {
              select: { supplier: true },
            },
            shelf: {
              select: {
                location: true,
                position: true,
              },
            },
          },
        },
      },
    });

    if (!igr) {
      return res.status(404).json({
        success: false,
        message: "Incoming good receipt tidak ditemukan",
      });
    }

    const formattedData = {
      no_igr: igr.no_igr,
      no_po: igr.purchase_order.no_po,
      user_created: igr.purchase_order.created_by.email,
      location: igr.purchase_order.material_requests[0]?.location?.name || "-",
      date: new Date(igr.received_date).toLocaleDateString("id-ID"),
      items: igr.items.map((item, index) => ({
        no: index + 1,
        item: item.item.name,
        code: item.item.code,
        supplier: item.purchase_order_item?.supplier || "-",
        quantity: item.quantity,
        location: item.shelf.location,
        position: item.shelf.position,
      })),
    };

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=incoming-good-receipt-${
        formattedData.no_igr || id
      }.pdf`
    );

    generateIncomingGoodReceiptPDF(formattedData, res);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Gagal membuat PDF",
      error: err.message,
    });
  }
};

// export const downloadDeliveryOrderPDF = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const do = await prisma.delivery_Order.findUnique({
//       where: { id },
//       include: {
//         delivery_order: {
//           select: {
//             no_do: true,
//             created_by: {
//               select: { email: true },
//             },
//             material_request: {
//               select: {
//                 location: {
//                   select: { name: true },
//                 },
//               },
//               take: 1, // Ambil salah satu lokasi (diasumsikan sama)
//             },
//           },
//         },
//         items: {
//           select: {
//             quantity: true,
//             item: {
//               select: { name: true, code: true, },
//             },
//             delivery_order_item: {
//               select: { supplier: true },
//             },
//             shelf: {
//               select: {
//                 location: true,
//                 position: true,
//               },
//             },
//           },
//         },
//       }
//     });

//     if (!do) {
//       return res.status(404).json({
//         success: false,
//         message: "Delivery order tidak ditemukan",
//       });
//     }

//     const formattedData = {
//       no_do: do.no_do,
//       user_created: do.delivery_order.created_by.email,
//       location: do.delivery_order.material_request[0]?.location?.name || "-",
//       date: new Date(do.created_at).toLocaleDateString("id-ID"),
//       items: do.items.map((item, index) => ({
//         no: index + 1,
//         item: item.item.name,
//         code: item.item.code,
//         supplier: item.delivery_order_item?.supplier || "-",
//         quantity: item.quantity,
//         location: item.shelf.location,
//         position: item.shelf.position,
//       })),
//     };

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=delivery-order-${
//         formattedData.no_do || id
//       }.pdf`
//     );

//     generateDeliveryOrderPDF(formattedData, res);
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Gagal membuat PDF",
//       error: err.message,
//     });
//   }
// }