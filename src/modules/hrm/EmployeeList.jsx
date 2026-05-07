import { useEffect, useState } from 'react';
import { hrmDeleteEmployee, hrmListDepartments, hrmListEmployees } from './hrm.api.js';
import { HRM_I18N } from './hrm-i18n.js';

const STATUS_COLOR = {
  ACTIVE: '#059669',
  INACTIVE: '#d97706',
  TERMINATED: '#dc2626',
};

export default function EmployeeList({ onEdit, onNew, lang }) {
  const t = HRM_I18N[lang] || HRM_I18N.az;
  const te = t.employees;
  const tc = t.common;

  const EMP_TYPE_LABEL = {
    FULL_TIME: te.employmentFull,
    PART_TIME: te.employmentPart,
    CONTRACT: te.employmentContract,
    INTERN: te.employmentIntern,
  };

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
        <h2 className="hrm-panel-title">{te.title}</h2>
        <button className="primary-btn" onClick={onNew}>{te.addNew}</button>
      </div>

      <div className="hrm-filters">
        <input
          className="hrm-search"
          placeholder={te.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="hrm-select" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
          <option value="">{te.allDepartments}</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select className="hrm-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">{te.allStatuses}</option>
          <option value="ACTIVE">{te.statusActiveOption}</option>
          <option value="INACTIVE">{te.statusInactiveOption}</option>
          <option value="TERMINATED">{te.statusTerminatedOption}</option>
        </select>
      </div>

      {error && <div className="hrm-error">{error}</div>}

      {loading ? (
        <div className="hrm-loading">{tc.loading}</div>
      ) : (
        <div className="hrm-table-wrapper">
          <table className="hrm-table">
            <thead>
              <tr>
                <th>{te.colCode}</th>
                <th>{te.colName}</th>
                <th>{te.colDept}</th>
                <th>{te.colPosition}</th>
                <th>{te.colEmployment}</th>
                <th>{te.colSalary}</th>
                <th>{te.colStatus}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr><td colSpan={8} className="hrm-empty">{te.notFound}</td></tr>
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
                    {emp.status === 'ACTIVE' ? te.statusActive : emp.status === 'INACTIVE' ? te.statusInactive : te.statusTerminated}
                  </td>
                  <td className="hrm-actions">
                    <button className="ghost-btn" onClick={() => onEdit(emp)}>{tc.edit}</button>
                    <button
                      className="ghost-btn danger"
                      onClick={() => setConfirmDelete(emp)}
                    >
                      {tc.delete}
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
            <h3>{te.deleteConfirmTitle}</h3>
            <p>{te.deleteConfirmBody(confirmDelete.firstName, confirmDelete.lastName)}</p>
            <div className="hrm-modal-footer">
              <button className="ghost-btn" onClick={() => setConfirmDelete(null)}>{tc.cancel}</button>
              <button className="primary-btn danger" onClick={() => handleDelete(confirmDelete.id)}>{tc.delete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
