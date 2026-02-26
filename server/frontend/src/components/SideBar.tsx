import { NavLink } from 'react-router-dom';

export default function SideBar() {
  return (
    <aside className="w-56 border-r border-slate-200 bg-slate-50 p-3">
      <nav className="space-y-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `block rounded px-3 py-2 text-sm font-medium transition ${
              isActive
                ? 'bg-sky-800 text-white'
                : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
            }`
          }
        >
          Dashboard
        </NavLink>
      </nav>
    </aside>
  );
}
