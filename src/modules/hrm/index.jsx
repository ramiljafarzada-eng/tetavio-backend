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

const VIEWS = [
  { id: 'employees', label: 'İşçilər' },
  { id: 'departments', label: 'Şöbələr' },
  { id: 'positions', label: 'Vəzifələr' },
  { id: 'schedules', label: 'İş Cədvəlləri' },
  { id: 'attendance', label: 'Davamiyyət' },
  { id: 'leave', label: 'Məzuniyyət' },
  { id: 'payroll', label: 'Əməkhaqqı' },
];

function reducer(state, action) {
  switch (action.type) {
    case 'SET_VIEW': return { ...state, view: action.payload, editEmployee: null };
    case 'EDIT_EMPLOYEE': return { ...state, view: 'employee-form', editEmployee: action.payload };
    case 'NEW_EMPLOYEE': return { ...state, view: 'employee-form', editEmployee: null };
    default: return state;
  }
}

export default function HrmModule({ backendSession, updateBackendSession }) {
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

  const handleSaved = () => dispatch({ type: 'SET_VIEW', payload: 'employees' });
  const handleBack = () => dispatch({ type: 'SET_VIEW', payload: 'employees' });

  return (
    <div className="hrm-module">
      <div className="hrm-sidebar">
        <div className="hrm-sidebar-title">HRM</div>
        {VIEWS.map((v) => (
          <button
            key={v.id}
            className={`hrm-nav-item ${state.view === v.id ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_VIEW', payload: v.id })}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="hrm-content">
        {state.view === 'employees' && (
          <EmployeeList
            onEdit={(emp) => dispatch({ type: 'EDIT_EMPLOYEE', payload: emp })}
            onNew={() => dispatch({ type: 'NEW_EMPLOYEE' })}
          />
        )}
        {state.view === 'employee-form' && (
          <EmployeeForm
            employee={state.editEmployee}
            onSaved={handleSaved}
            onCancel={handleBack}
          />
        )}
        {state.view === 'departments' && <DepartmentList />}
        {state.view === 'positions' && <PositionList />}
        {state.view === 'schedules' && <WorkScheduleList />}
        {state.view === 'attendance' && <AttendanceDashboard />}
        {state.view === 'leave' && <LeaveDashboard />}
        {state.view === 'payroll' && <PayrollDashboard />}
      </div>
    </div>
  );
}
