using ShopMeBe.Core.DTOs.Admin;

namespace ShopMeBe.Core.Interfaces;

public interface IAdminService
{
    Task<DashboardDto> GetDashboardAsync();
}
