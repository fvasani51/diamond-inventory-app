import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";

export default function Inquiries() {
  const [inquiries, setInquiries] = useState([]);

  const load = async () => {
    const { data } = await api.get("/inquiry");
    setInquiries(data);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await api.put(`/inquiry/${id}`, { status });
    load();
  };

  return (
    <Layout>
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Company</th><th>Contact</th><th>Shapes</th><th>Carat</th><th>Color</th><th>Clarity</th><th>Cut/Pol/Sym</th><th>Lab</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {inquiries.map((i) => (
            <tr key={i._id}>
              <td>{i.name}</td>
              <td>{i.companyName}</td>
              <td>{i.email}<br /><span className="mono">{i.phone}</span></td>
              <td>{i.shapes?.join(", ") || "—"}</td>
              <td>{i.caratFrom || "?"}–{i.caratTo || "?"}</td>
              <td>{i.colors?.join(", ") || "—"}</td>
              <td>{i.clarity?.join(", ") || "—"}</td>
              <td>{i.cut?.join(", ") || "—"} / {i.polish?.join(", ") || "—"} / {i.symmetry?.join(", ") || "—"}</td>
              <td>{i.lab?.join(", ") || "—"}</td>
              <td>
                <select value={i.status} onChange={(e) => updateStatus(i._id, e.target.value)}>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>
              </td>
            </tr>
          ))}
          {inquiries.length === 0 && <tr><td colSpan="10" style={{ textAlign: "center", padding: 20 }}>No inquiries yet</td></tr>}
        </tbody>
      </table>
    </Layout>
  );
}