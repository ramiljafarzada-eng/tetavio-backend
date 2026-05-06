import { useEffect, useState } from 'react';
import {
  hrmCreateEmployee,
  hrmListDepartments,
  hrmListEmployees,
  hrmListPositions,
  hrmListSchedules,
  hrmUpdateEmployee,
} from './hrm.api.js';

const EMPTY = {
  firstName: '', lastName: '', email: '', phone: '',
  dateOfBirth: '', taxId: '', ssn: '', bankAccount: '',
  departmentId: '', positionId: '', workScheduleId: '', managerId: '',
  employmentType: 'FULL_TIME', startDate: '',
  baseSalaryMinor: '', hrmRole: 'EMPLOYEE',
};

export default function EmployeeForm({ employee, onSaved, onCancel }) {
  const [form, setForm] = useState(employee ? {
    ...EMPTY,
    ...employee,
    baseSalaryMinor: employee.baseSalaryMinor ? (employee.baseSalaryMinor / 100).toFixed(2) : '',
    dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.slice(0, 10) : '',
    startDate: employee.startDate ? employee.startDate.slice(0, 10) : '',
    departmentId: employee.departmentId || '',
    positionId: employee.positionId || '',
    workScheduleId: employee.workScheduleId || '',
    managerId: employee.managerId || '',
    ssn: employee.ssn || '',
  } : EMPTY);

  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      hrmListDepartments().catch(() => []),
      hrmListPositions().catch(() => []),
      hrmListSchedules().catch(() => []),
      hrmListEmployees({ status: 'ACTIVE' }).catch(() => []),
    ]).then(([depts, pos, scheds, emps]) => {
      setDepartments(depts);
      setPositions(pos);
      setSchedules(scheds);
      setEmployees(emps.filter((e) => !employee || e.id !== employee.id));
    });
  }, []);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const f = (name) => ({ value: form[name], onChange: (e) => set(name, e.target.value) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        baseSalaryMinor: Math.round(parseFloat(form.baseSalaryMinor || '0') * 100),
        dateOfBirth: form.dateOfBirth || undefined,
        departmentId: form.departmentId || undefined,
        positionId: form.positionId || undefined,
        workScheduleId: form.workScheduleId || undefined,
        managerId: form.managerId || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        taxId: form.taxId || undefined,
        ssn: form.ssn || undefined,
        bankAccount: form.bankAccount || undefined,
      };

      if (employee) {
        await hrmUpdateEmployee(employee.id, payload);
      } else {
        await hrmCreateEmployee(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="hrm-panel">
      <div className="hrm-panel-header">
        <h2 className="hrm-panel-title">{employee ? 'İşçini düzəlt' : 'Yeni işçi'}</h2>
        <button className="ghost-btn" onClick={onCancel}>← Geri</button>
      </div>

      {error && <div className="hrm-error">{error}</div>}

      <form className="hrm-form" onSubmit={handleSubmit}>
        <div className="hrm-form-section">
          <h3>Şəxsi məlumatlar</h3>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>Ad *</label>
              <input {...f('firstName')} required maxLength={100} />
            </div>
            <div className="hrm-field">
              <label>Soyad *</label>
              <input {...f('lastName')} required maxLength={100} />
            </div>
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>Email</label>
              <input type="email" {...f('email')} />
            </div>
            <div className="hrm-field">
              <label>Telefon</label>
              <input {...f('phone')} placeholder="+994501234567" />
            </div>
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>Doğum tarixi</label>
              <input type="date" {...f('dateOfBirth')} />
            </div>
            <div className="hrm-field">
              <label>FİN</label>
              <input {...f('taxId')} maxLength={50} placeholder="AA1234567" />
            </div>
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>SSN</label>
              <input {...f('ssn')} maxLength={50} placeholder="XXX-XX-XXXX" />
            </div>
            <div className="hrm-field">
              <label>Bank hesabı (IBAN)</label>
              <input {...f('bankAccount')} maxLength={100} />
            </div>
          </div>
        </div>

        <div className="hrm-form-section">
          <h3>İş məlumatları</h3>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>Şöbə</label>
              <select {...f('departmentId')}>
                <option value="">Seçin...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="hrm-field">
              <label>Vəzifə</label>
              <select {...f('positionId')}>
                <option value="">Seçin...</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>İş cədvəli</label>
              <select {...f('workScheduleId')}>
                <option value="">Seçin...</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.isDefault ? ' (default)' : ''}</option>
                ))}
              </select>
            </div>
            <div className="hrm-field">
              <label>Rəhbər</label>
              <select {...f('managerId')}>
                <option value="">Seçin...</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>HRM Rolu</label>
              <select {...f('hrmRole')}>
                <option value="EMPLOYEE">İşçi</option>
                <option value="MANAGER">Menecer</option>
                <option value="HR">HR</option>
              </select>
            </div>
            <div className="hrm-field">
              <label>İstihdam növü *</label>
              <select {...f('employmentType')} required>
                <option value="FULL_TIME">Tam ştat</option>
                <option value="PART_TIME">Yarı ştat</option>
                <option value="CONTRACT">Müqavilə</option>
                <option value="INTERN">Təcrübəçi</option>
              </select>
            </div>
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>Başlama tarixi *</label>
              <input type="date" {...f('startDate')} required />
            </div>
            <div className="hrm-field">
              <label>Əsas maaş (AZN) *</label>
              <input type="number" step="0.01" min="0" {...f('baseSalaryMinor')} required placeholder="0.00" />
            </div>
          </div>
        </div>

        <div className="hrm-form-footer">
          <button type="button" className="ghost-btn" onClick={onCancel} disabled={saving}>Ləğv et</button>
          <button type="submit" className="primary-btn" disabled={saving}>
            {saving ? 'Saxlanılır...' : 'Saxla'}
          </button>
        </div>
      </form>
    </div>
  );
}
