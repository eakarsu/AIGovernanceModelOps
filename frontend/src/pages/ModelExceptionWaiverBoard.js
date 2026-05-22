import React, { useEffect, useState } from 'react';

export default function ModelExceptionWaiverBoard() {
  const [data, setData] = useState(null);
  const token = localStorage.getItem('token');
  useEffect(() => {
    fetch('/api/model-exception-waiver-board', { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then((r) => r.json()).then(setData).catch(() => {});
  }, [token]);
  return (
    <div>
      <h1>Model Exception Waiver Board</h1>
      <p>Tracks model governance exceptions, approval lane, expiration pressure, and required evidence.</p>
      {data?.waivers?.map((w) => (
        <section key={`${w.model}-${w.control}`} className="card">
          <h3>{w.model}</h3>
          <p>{w.control} - {w.approval_lane} - {w.status}</p>
          <ul>{w.required_evidence.map((e) => <li key={e}>{e}</li>)}</ul>
        </section>
      ))}
    </div>
  );
}
