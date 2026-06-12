namespace ShopMeBe.Core.Enums;

public enum OrderStatus
{
    Pending = 0,
    Confirmed = 1,
    Shipping = 2,
    Completed = 3,
    Cancelled = 4
}

public enum PaymentMethod
{
    COD = 0,
    BankTransfer = 1,
    EWallet = 2,
    Wallet = 3
}

public enum PaymentStatus
{
    Unpaid = 0,
    Paid = 1,
    Refunded = 2
}

public enum PurchaseOrderStatus
{
    Draft = 0,
    Ordered = 1,
    PartiallyReceived = 2,
    Received = 3,
    Cancelled = 4
}

public enum StockTransactionType
{
    Import = 0,
    Export = 1,
    Adjustment = 2,
    SaleDeduction = 3,
    ReturnToSupplier = 4
}
