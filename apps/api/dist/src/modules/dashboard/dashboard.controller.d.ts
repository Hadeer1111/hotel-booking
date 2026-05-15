import { DashboardService } from './dashboard.service';
import type { AuthUser } from '../auth/types';
export declare class DashboardController {
    private readonly dashboard;
    constructor(dashboard: DashboardService);
    stats(actor: AuthUser): Promise<import("./dashboard.service").DashboardStats>;
}
