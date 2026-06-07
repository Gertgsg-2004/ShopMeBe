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
    EWallet = 2
}

public enum PaymentStatus
{
    Unpaid = 0,
    Paid = 1,
    Refunded = 2
}
