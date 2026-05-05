import { useEffect, useState } from 'react';
import { hrmDeleteEmployee, hrmListDepartments, hrmListEmployees } from './hrm.api.js';

const STATUS_COLOR = {
  ACTIVE: '#059669',
  INACTIVE: '#d97706',
  TERMINATED: '#dc2626',
};

const EMP_TYPE_LABEL = {
  FULL_TIME: 'Tam ştat',
  PART_TIME: 'Yarı ştat',
  CONTRACT: 'Müqavilə',
  INTERN: 'Təcrübəçi',
};

export default function EmployeeList({ onEdit, onNew }) {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      hrmListEmployees({ search: search || undefined, departmentId: deptFilter || undefined, status: statusFilter || undefined }),
      hrmListDepartments(),
    ])
      .then(([emps, depts]) => {
        setEmployees(emps || []);
        setDepartments(depts || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, deptFilter, statusFilter]);

  const handleDelete = async (id) => {
    try {
      await hrmDeleteEmployee(id);
      setConfirmDelete(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="hrm-panel">
      <div className="hrm-panel-header">
        <h2 className="hrm-panel-title">İşçilər</h2>
        <button className="primary-btn" onClick={onNew}>+ Yeni işçi</button>
      </div>

      <div className="hrm-filters">
        <input
          className="hrm-search"
          placeholder="Ad, kod, email ilə axtar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="hrm-select" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
          <option value="">Bütün şöbələr</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select className="hrm-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Bütün statuslar</option>
          <option value="ACTIVE">Aktiv</option>
          <option value="INACTIVE">Qeyri-aktiv</option>
          <option value="TERMINATED">İşdən çıxmış</option>
        </select>
      </div>

      {error && <div className="hrm-error">{error}</div>}

      {loading ? (
        <div className="hrm-loading">Yüklənir...</div>
      ) : (
        <div className="hrm-table-wrapper">
          <table className="hrm-table">
            <thead>
              <tr>
                <th>Kod</th>
                <th>Ad Soyad</th>
                <th>Şöbə</th>
                <th>Vəzifə</th>
                <th>İstihdam</th>
                <th>Maaş (AZN)</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr><td colSpan={8} className="hrm-empty">İşçi tapılmadı</td></tr>
              )}
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td className="hrm-code">{emp.employeeCode}</td>
                  <td>
                    <div className="hrm-name">{emp.firstName} {emp.lastName}</div>
                    {emp.email && <div className="hrm-sub">{emp.email}</div>}
                  </td>
                  <td>{emp.department?.name || '—'}</td>
                  <td>{emp.position?.title || '—'}</td>
                  <td>{EMP_TYPE_LABEL[emp.employmentType] || emp.employmentType}</td>
                  <td>{(emp.baseSalaryMinor / 100).toFixed(2)}</td>
                  <td>
                    <span className="hrm-status-dot" style={{ background: STATUS_COLOR[emp.status] }} />
                    {emp.status === 'ACTIVE' ? 'Aktiv' : emp.status === 'INACTIVE' ? 'Qeyri-aktiv' : 'Çıxmış'}
                  </td>
                  <td className="hrm-actions">
                    <button className="ghost-btn" onClick={() => onEdit(emp)}>Düzəlt</button>
                    <button
                      className="ghost-btn danger"
                      onClick={() => setConfirmDelete(emp)}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <div className="hrm-modal-backdrop" onClick={() => setConfirmDelete(null)}>
          <div className="hrm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Silmək istədiyinizə əminsiniz?</h3>
            <p>{confirmDelete.firstName} {confirmDelete.lastName} işçisi silinəcək (soft delete).</p>
            <div className="hrm-modal-footer">
              <button className="ghost-btn" onClick={() => setConfirmDelete(null)}>Ləğv et</button>
              <button className="primary-btn danger" onClick={() => handleDelete(confirmDelete.id)}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
