import { PrismaClient } from "@prisma/client";
import { updateIGRItemStatusSchema } from "../utils/incomingGoodReceipt.validation.js";

const prisma = new PrismaClient();

export const getAllIncomingGoodReceipts = async (req, res) => {
  try {
    const incomingGoodReceipts = await prisma.incoming_Good_Receipt.findMany({
      select: {
        id: true,
        no_igr: true,
        purchase_order: {
          select: {
            id: true,
            no_po: true,
            created_by: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil data Incoming Good Receipt",
      data: incomingGoodReceipts,
    });
  } catch (error) {
    console.error("Error in getAllIncomingGoodReceipts:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getIncomingGoodReceiptById = async (req, res) => {
  try {
    const { id } = req.params;

    const incomingGoodReceipt = await prisma.incoming_Good_Receipt.findUnique({
      where: { id },
      include: {
        purchase_order: {
          select: {
            id: true,
            no_po: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            status: true,
            created_at: true,
            item: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            shelf: {
              select: {
                id: true,
                location: true,
                position: true,
              },
            },
          },
        },
      },
    });

    if (!incomingGoodReceipt) {
      return res.status(404).json({
        success: false,
        message: "Incoming Good Receipt tidak ditemukan",
      });
    }

    const { received_date, created_at, purchase_order_id, ...filteredReceipt } =
      incomingGoodReceipt;

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil data Incoming Good Receipt",
      data: {
        ...filteredReceipt,
        purchase_order: {
          id: incomingGoodReceipt.purchase_order.id,
          no_po: incomingGoodReceipt.purchase_order.no_po,
        },
        items: incomingGoodReceipt.items,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteIncomingGoodReceipt = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.incoming_Good_Receipt_Item.deleteMany({
      where: { igr_id: id },
    });

    const deleteIGR = await prisma.incoming_Good_Receipt.delete({
      where: { id: id },
    });
    res.status(200).json({
      success: true,
      message: "Incoming Good Receipt berhasil dihapus",
      data: deleteIGR,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat menghapus Incoming Good Receipt",
      error: err.message,
    });
  }
};

export const updateIGRItemStatus = async (req, res) => {
  try {
    const { id } = req.params; // id dari IGR item
    const parsed = updateIGRItemStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid input", errors: parsed.error.flatten() });
    }

    const { status } = parsed.data;

    // Cek apakah item IGR ada
    const igrItem = await prisma.incoming_Good_Receipt_Item.findUnique({
      where: { id },
    });

    if (!igrItem) {
      return res.status(404).json({ message: "IGR item not found" });
    }

    // Jika status sudah sama, tidak perlu update
    if (igrItem.status === status) {
      return res
        .status(200)
        .json({ message: "Status is already set to this value" });
    }

    // Update status
    await prisma.incoming_Good_Receipt_Item.update({
      where: { id },
      data: { status },
    });

    // Jika status jadi "received", update stok shelf
    if (status === "received") {
      await prisma.shelf.update({
        where: { id: igrItem.shelf_id },
        data: {
          stock_qty: {
            increment: igrItem.quantity,
          },
        },
      });
    }

    return res.status(200).json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Error updating IGR item status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
