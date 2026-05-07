import { useEffect, useReducer } from 'react';
import AttendanceDashboard from './AttendanceDashboard.jsx';
import DepartmentList from './DepartmentList.jsx';
import EmployeeForm from './EmployeeForm.jsx';
import EmployeeList from './EmployeeList.jsx';
import LeaveDashboard from './LeaveDashboard.jsx';
import PayrollDashboard from './PayrollDashboard.jsx';
import PositionList from './PositionList.jsx';
import WorkScheduleList from './WorkScheduleList.jsx';
import { initHrmApi } from './hrm.api.js';
import { HRM_I18N } from './hrm-i18n.js';

const VIEW_IDS = ['employees', 'departments', 'positions', 'schedules', 'attendance', 'leave', 'payroll'];

function reducer(state, action) {
  switch (action.type) {
    case 'SET_VIEW': return { ...state, view: action.payload, editEmployee: null };
    case 'EDIT_EMPLOYEE': return { ...state, view: 'employee-form', editEmployee: action.payload };
    case 'NEW_EMPLOYEE': return { ...state, view: 'employee-form', editEmployee: null };
    default: return state;
  }
}

export default function HrmModule({ backendSession, updateBackendSession, lang }) {
  const [state, dispatch] = useReducer(reducer, {
    view: 'employees',
    editEmployee: null,
  });

  useEffect(() => {
    if (backendSession?.accessToken) {
      window.__hrmSession = backendSession;
      initHrmApi(updateBackendSession);
    }
  }, [backendSession?.accessToken]);

  const t = HRM_I18N[lang] || HRM_I18N.az;
  const handleSaved = () => dispatch({ type: 'SET_VIEW', payload: 'employees' });
  const handleBack = () => dispatch({ type: 'SET_VIEW', payload: 'employees' });

  return (
    <div className="hrm-module">
      <div className="hrm-sidebar">
        <div className="hrm-sidebar-title">HRM</div>
        {VIEW_IDS.map((id) => (
          <button
            key={id}
            className={`hrm-nav-item ${state.view === id ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_VIEW', payload: id })}
          >
            {t.nav[id]}
          </button>
        ))}
      </div>

      <div className="hrm-content">
        {state.view === 'employees' && (
          <EmployeeList
            lang={lang}
            onEdit={(emp) => dispatch({ type: 'EDIT_EMPLOYEE', payload: emp })}
            onNew={() => dispatch({ type: 'NEW_EMPLOYEE' })}
          />
        )}
        {state.view === 'employee-form' && (
          <EmployeeForm
            lang={lang}
            employee={state.editEmployee}
            onSaved={handleSaved}
            onCancel={handleBack}
          />
        )}
        {state.view === 'departments' && <DepartmentList lang={lang} />}
        {state.view === 'positions' && <PositionList lang={lang} />}
        {state.view === 'schedules' && <WorkScheduleList lang={lang} />}
        {state.view === 'attendance' && <AttendanceDashboard lang={lang} />}
        {state.view === 'leave' && <LeaveDashboard lang={lang} />}
        {state.view === 'payroll' && <PayrollDashboard lang={lang} />}
      </div>
    </div>
  );
}
