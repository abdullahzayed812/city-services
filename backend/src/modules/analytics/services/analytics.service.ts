import { db } from '../../../core/database';
import { redis } from '../../../core/redis';

export class AnalyticsService {
  async getDashboardKPIs(): Promise<object> {
    const cacheKey = 'admin_kpis';
    const cached = await redis.getJSON<object>(cacheKey);
    if (cached) return cached;

    const [
      totalUsers, activeCustomers, activeTechnicians,
      todayRequests, pendingRequests, completedRequests,
      todayRevenue, totalRevenue,
      pendingTechnicians,
    ] = await Promise.all([
      db.query<any[]>("SELECT COUNT(*) as count FROM users WHERE role != 'admin'"),
      db.query<any[]>("SELECT COUNT(*) as count FROM users WHERE role = 'customer' AND status = 'active'"),
      db.query<any[]>("SELECT COUNT(*) as count FROM users WHERE role = 'technician' AND status = 'active'"),
      db.query<any[]>("SELECT COUNT(*) as count FROM service_requests WHERE DATE(created_at) = CURDATE()"),
      db.query<any[]>("SELECT COUNT(*) as count FROM service_requests WHERE status = 'pending'"),
      db.query<any[]>("SELECT COUNT(*) as count FROM service_requests WHERE status = 'completed'"),
      db.query<any[]>("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'commission' AND DATE(created_at) = CURDATE() AND status = 'completed'"),
      db.query<any[]>("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'commission' AND status = 'completed'"),
      db.query<any[]>("SELECT COUNT(*) as count FROM technician_profiles WHERE verification_status = 'pending'"),
    ]);

    const kpis = {
      users: {
        total: totalUsers[0].count,
        customers: activeCustomers[0].count,
        technicians: activeTechnicians[0].count,
        pendingTechnicians: pendingTechnicians[0].count,
      },
      requests: {
        today: todayRequests[0].count,
        pending: pendingRequests[0].count,
        completed: completedRequests[0].count,
      },
      revenue: {
        today: parseFloat(todayRevenue[0].total),
        total: parseFloat(totalRevenue[0].total),
      },
    };

    await redis.setJSON(cacheKey, kpis, 300);
    return kpis;
  }

  async getRequestsChart(days: number = 30): Promise<object[]> {
    return db.query<any[]>(
      `SELECT DATE(created_at) as date, COUNT(*) as count, status
       FROM service_requests
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at), status
       ORDER BY date ASC`,
      [days]
    );
  }

  async getTopServices(limit: number = 10): Promise<object[]> {
    return db.query<any[]>(
      `SELECT sc.name_ar, sc.icon_url, COUNT(sr.id) as request_count,
              COALESCE(AVG(sr.final_price), 0) as avg_price
       FROM service_categories sc
       LEFT JOIN service_requests sr ON sr.category_id = sc.id
       GROUP BY sc.id
       ORDER BY request_count DESC
       LIMIT ?`,
      [limit]
    );
  }

  async getTopTechnicians(limit: number = 10): Promise<object[]> {
    return db.query<any[]>(
      `SELECT u.id, u.full_name, u.avatar_url,
              tp.rating_average, tp.completed_jobs, tp.rating_count
       FROM users u
       JOIN technician_profiles tp ON tp.user_id = u.id
       WHERE tp.verification_status = 'approved'
       ORDER BY tp.completed_jobs DESC, tp.rating_average DESC
       LIMIT ?`,
      [limit]
    );
  }

  async getRevenueReport(fromDate: string, toDate: string): Promise<object[]> {
    return db.query<any[]>(
      `SELECT DATE(created_at) as date, SUM(amount) as total, COUNT(*) as transactions
       FROM transactions
       WHERE type = 'commission' AND status = 'completed'
         AND created_at BETWEEN ? AND ?
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [fromDate, toDate]
    );
  }
}
