const NavItem = ({ icon, label }) => (
  <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-100 dark:hover:text-gray-900 dark:text-gray-300 cursor-pointer transition-colors">
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </div>
);

export default NavItem;