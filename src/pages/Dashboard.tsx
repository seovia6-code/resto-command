import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchSummary, fetchOrders } from "../api/dashboard";

export default function Dashboard() {
  const fetchSummaryFn = useServerFn(fetchSummary);
  const fetchOrdersFn = useServerFn(fetchOrders);

  const [summary, setSummary] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [s, o] = await Promise.all([fetchSummaryFn(), fetchOrdersFn()]);
        setSummary(s);
        setOrders(o as any[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fetchSummaryFn, fetchOrdersFn]);

  if (loading) return <p style={{ padding: "2rem" }}>Loading...</p>;
  if (error)
    return <p style={{ padding: "2rem", color: "red" }}>Error: {error}</p>;

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>WhatsApp Dashboard</h1>
      <div style={{ display: "flex", gap: "1rem", margin: "1.5rem 0" }}>
        <StatCard label="Total Chats" value={summary?.totalChats ?? 0} />
        <StatCard label="Total Messages" value={summary?.totalMessages ?? 0} />
      </div>
      <h2>Orders by Type</h2>
      <ul>
        {Object.entries(summary?.ordersByType ?? {}).map(([type, count]) => (
          <li key={type}>
            {type}: {String(count)}
          </li>
        ))}
      </ul>
      <h2 style={{ marginTop: "1.5rem" }}>Recent Orders</h2>
      <table
        width="100%"
        cellPadding={8}
        style={{ borderCollapse: "collapse" }}
      >
        <thead style={{ background: "#f0f0f0" }}>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Type</th>
            <th>Phone</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.order_id} style={{ borderBottom: "1px solid #eee" }}>
              <td>{o.order_id}</td>
              <td>{o.customer_name}</td>
              <td>{o.order_type}</td>
              <td>{o.phone}</td>
              <td>{new Date(o.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        padding: "1rem 1.5rem",
        background: "#f5f5f5",
        borderRadius: 8,
        minWidth: 150,
      }}
    >
      <div style={{ fontSize: 32, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{label}</div>
    </div>
  );
}
