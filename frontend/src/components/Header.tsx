import { Button } from '@/components/ui/button';
import { Menu, User, Settings } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  showAdminButton?: boolean;
  onAdminClick?: () => void;
}

const Header = ({ onMenuClick, showAdminButton = false, onAdminClick }: HeaderProps) => {
  return (
    <header className="bg-primary shadow-lg border-b border-primary-dark/20 sticky top-0 z-50">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="md:hidden text-white hover:bg-white/20 h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center">
                <img 
                  src="/logo.svg" 
                  alt="Treesh" 
                  className="w-full h-full text-white"
                />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white font-treesh truncate">
                Treesh
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {showAdminButton && (
              <Button
                onClick={onAdminClick}
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center space-x-1 sm:space-x-2 text-white border-white hover:bg-white hover:text-primary font-inter text-xs sm:text-sm px-2 sm:px-4"
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
            >
              <User className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;