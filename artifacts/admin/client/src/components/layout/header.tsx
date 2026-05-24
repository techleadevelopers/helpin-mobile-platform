import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="glass-header border-b border-gray-100 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-950">{title}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Busque ou pressione Ctrl+K"
              className="h-9 w-64 rounded-xl border-gray-200 pl-10 text-sm focus:border-transparent focus:ring-2 focus:ring-light-blue"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
          
          {/* Notifications */}
          <button className="relative rounded-xl p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
