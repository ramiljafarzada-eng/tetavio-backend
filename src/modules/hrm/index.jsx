import { useEffect, useReducer } from 'react';
import EmployeeForm from './EmployeeForm.jsx';
import EmployeeList from './EmployeeList.jsx';
import PayrollDashboard from './PayrollDashboard.jsx';
import { initHrmApi } from './hrm.api.js';

const VIEWS = [
  { id: 'employees', label: 'İşçilər' },
  { id: 'payroll', label: 'Əməkhaqqı' },
];

function reducer(state, action) {
  switch (action.type) {
    case 'SET_VIEW': return { ...state, view: action.payload, editEmployee: null };
    case 'EDIT_EMPLOYEE': return { ...state, view: 'employee-form', editEmployee: action.payload };
    case 'NEW_EMPLOYEE': return { ...state, view: 'employee-form', editEmployee: null };
    case 'BACK': return { ...state, view: state.prevView || 'employees', editEmployee: null };
    default: return state;
  }
}

export default function HrmModule({ backendSession, updateBackendSession }) {
  const [state, dispatch] = useReducer(reducer, {
    view: 'employees',
    editEmployee: null,
    prevView: 'employees',
  });

  useEffect(() => {
    if (backendSession?.accessToken) {
      window.__hrmSession = backendSession;
      initHrmApi(updateBackendSession);
    }
  }, [backendSession?.accessToken]);

  const handleSaved = () => dispatch({ type: 'SET_VIEW', payload: 'employees' });
  const handleBack = () => dispatch({ type: 'SET_VIEW', payload: state.prevView || 'employees' });

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
        {(state.view === 'employees') && (
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

        {state.view === 'payroll' && <PayrollDashboard />}
      </div>
    </div>
  );
}
