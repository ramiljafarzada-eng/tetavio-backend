import { useEffect, useState } from 'react';
import {
  hrmCreateEmployee,
  hrmListDepartments,
  hrmListEmployees,
  hrmListPositions,
  hrmListSchedules,
  hrmUpdateEmployee,
} from './hrm.api.js';
import { HRM_I18N } from './hrm-i18n.js';

const EMPTY = {
  firstName: '', lastName: '', email: '', phone: '',
  dateOfBirth: '', taxId: '', ssn: '', idCardNumber: '', education: '', bankAccount: '',
  departmentId: '', positionId: '', workScheduleId: '', managerId: '',
  employmentType: 'FULL_TIME', startDate: '',
  baseSalaryMinor: '', hrmRole: 'EMPLOYEE',
};

export default function EmployeeForm({ employee, onSaved, onCancel, lang }) {
  const t = HRM_I18N[lang] || HRM_I18N.az;
  const tf = t.employeeForm;
  const tc = t.common;

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
    idCardNumber: employee.idCardNumber || '',
    education: employee.education || '',
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
        firstName: form.firstName,
        lastName: form.lastName,
        employmentType: form.employmentType,
        startDate: form.startDate,
        hrmRole: form.hrmRole,
        baseSalaryMinor: Math.round(parseFloat(form.baseSalaryMinor || '0') * 100),
        ...(form.email        && { email: form.email }),
        ...(form.phone        && { phone: form.phone }),
        ...(form.dateOfBirth  && { dateOfBirth: form.dateOfBirth }),
        ...(form.taxId        && { taxId: form.taxId }),
        ...(form.ssn          && { ssn: form.ssn }),
        ...(form.idCardNumber && { idCardNumber: form.idCardNumber }),
        ...(form.education    && { education: form.education }),
        ...(form.bankAccount  && { bankAccount: form.bankAccount }),
        ...(form.departmentId  && { departmentId: form.departmentId }),
        ...(form.positionId    && { positionId: form.positionId }),
        ...(form.workScheduleId && { workScheduleId: form.workScheduleId }),
        ...(form.managerId     && { managerId: form.managerId }),
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
        <h2 className="hrm-panel-title">{employee ? tf.titleEdit : tf.titleNew}</h2>
        <button className="ghost-btn" onClick={onCancel}>{tc.back}</button>
      </div>

      {error && <div className="hrm-error">{error}</div>}

      <form className="hrm-form" onSubmit={handleSubmit}>
        <div className="hrm-form-section">
          <h3>{tf.sectionPersonal}</h3>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>{tf.firstName}</label>
              <input {...f('firstName')} required maxLength={100} />
            </div>
            <div className="hrm-field">
              <label>{tf.lastName}</label>
              <input {...f('lastName')} required maxLength={100} />
            </div>
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>{tf.email}</label>
              <input type="email" {...f('email')} />
            </div>
            <div className="hrm-field">
              <label>{tf.phone}</label>
              <input {...f('phone')} placeholder="+994501234567" />
            </div>
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>{tf.dateOfBirth}</label>
              <input type="date" {...f('dateOfBirth')} />
            </div>
            <div className="hrm-field">
              <label>{tf.taxId}</label>
              <input {...f('taxId')} maxLength={50} placeholder="XXXXXXX" />
            </div>
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>{tf.ssn}</label>
              <input {...f('ssn')} maxLength={50} placeholder="XXX-XX-XXXX" />
            </div>
            <div className="hrm-field">
              <label>{tf.idCardNumber}</label>
              <input {...f('idCardNumber')} maxLength={50} placeholder="AA 1234567" />
            </div>
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>{tf.education}</label>
              <select {...f('education')}>
                <option value="">{tc.select}</option>
                <option value="Orta">{tf.educationSecondary}</option>
                <option value="Orta ixtisas">{tf.educationVocational}</option>
                <option value="Ali (bakalavr)">{tf.educationBachelor}</option>
                <option value="Ali (magistr)">{tf.educationMaster}</option>
                <option value="Doktorantura">{tf.educationPhd}</option>
                <option value="Digər">{tf.educationOther}</option>
              </select>
            </div>
            <div className="hrm-field">
              <label>{tf.bankAccount}</label>
              <input {...f('bankAccount')} maxLength={100} />
            </div>
          </div>
        </div>

        <div className="hrm-form-section">
          <h3>{tf.sectionWork}</h3>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>{tf.department}</label>
              <select {...f('departmentId')}>
                <option value="">{tc.select}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="hrm-field">
              <label>{tf.position}</label>
              <select {...f('positionId')}>
                <option value="">{tc.select}</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>{tf.workSchedule}</label>
              <select {...f('workScheduleId')}>
                <option value="">{tc.select}</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.isDefault ? ' (default)' : ''}</option>
                ))}
              </select>
            </div>
            <div className="hrm-field">
              <label>{tf.manager}</label>
              <select {...f('managerId')}>
                <option value="">{tc.select}</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>{tf.hrmRole}</label>
              <select {...f('hrmRole')}>
                <option value="EMPLOYEE">{tf.roleEmployee}</option>
                <option value="MANAGER">{tf.roleManager}</option>
                <option value="HR">{tf.roleHR}</option>
              </select>
            </div>
            <div className="hrm-field">
              <label>{tf.employmentType}</label>
              <select {...f('employmentType')} required>
                <option value="FULL_TIME">{tf.employmentFull}</option>
                <option value="PART_TIME">{tf.employmentPart}</option>
                <option value="CONTRACT">{tf.employmentContract}</option>
                <option value="INTERN">{tf.employmentIntern}</option>
              </select>
            </div>
          </div>
          <div className="hrm-form-row">
            <div className="hrm-field">
              <label>{tf.startDate}</label>
              <input type="date" {...f('startDate')} required />
            </div>
            <div className="hrm-field">
              <label>{tf.baseSalary}</label>
              <input type="number" step="0.01" min="0" {...f('baseSalaryMinor')} required placeholder="0.00" />
            </div>
          </div>
        </div>

        <div className="hrm-form-footer">
          <button type="button" className="ghost-btn" onClick={onCancel} disabled={saving}>{tc.cancel}</button>
          <button type="submit" className="primary-btn" disabled={saving}>
            {saving ? tc.saving : tc.save}
          </button>
        </div>
      </form>
    </div>
  );
}
