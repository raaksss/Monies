const NavItem = ({ icon, label }) => (
  <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </div>
);

export default NavItem;