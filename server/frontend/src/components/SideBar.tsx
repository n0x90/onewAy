import { NavLink } from 'react-router-dom';

type SideBarProps = {
  metasploitAvailable: boolean;
};

const baseLinkClass = ({ isActive }: { isActive: boolean }) =>
  `${isActive ? 'theme-nav-link theme-nav-link-active' : 'theme-nav-link'}`;

export default function SideBar({ metasploitAvailable }: SideBarProps) {
  return (
    <aside className="theme-sidebar w-full p-4 lg:min-h-[calc(100vh-4rem)] lg:w-64 lg:shrink-0">
      <nav className="space-y-2">
        <NavLink to="/dashboard" className={baseLinkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/clients" className={baseLinkClass}>
          Clients
        </NavLink>
        <NavLink to="/modules" className={baseLinkClass}>
          Modules
        </NavLink>
        {metasploitAvailable && (
          <NavLink to="/metasploit" className={baseLinkClass}>
            Metasploit
          </NavLink>
        )}
        <NavLink to="/builder" className={baseLinkClass}>
          Builder
        </NavLink>
      </nav>
    </aside>
  );
}
