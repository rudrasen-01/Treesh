import { Button } from '@/components/ui/button';
import { Download, Facebook, Twitter, Instagram, Youtube, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useTheme } from '@/components/theme-provider';

interface FooterProps {
  variant?: 'full' | 'compact';
}

export const Footer = ({ variant = 'full' }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();

  const handleSocialClick = (platform: string) => {
    toast({
      title: `Visit ${platform}`,
      description: `Opening ${platform} in a new window...`,
    });
    // Placeholder URLs - in production, these would be real social media URLs
    const socialLinks: Record<string, string> = {
      Facebook: 'https://facebook.com/treesh',
      Twitter: 'https://twitter.com/treesh',
      Instagram: 'https://instagram.com/treesh',
      YouTube: 'https://youtube.com/@treesh',
    };
    window.open(socialLinks[platform] || '#', '_blank');
  };

  const handleDownload = (platform: string) => {
    toast({
      title: `Download Treesh for ${platform}`,
      description: `Redirecting to ${platform === 'iOS' ? 'App Store' : 'Google Play'}...`,
    });
    // Placeholder URLs - in production, these would be real app store URLs
    const appLinks: Record<string, string> = {
      iOS: 'https://apps.apple.com/app/treesh',
      Android: 'https://play.google.com/store/apps/details?id=com.treesh',
    };
    window.open(appLinks[platform] || '#', '_blank');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  if (variant === 'compact') {
    return (
      <footer className={`transition-colors duration-300 border-t rounded-t-2xl overflow-hidden w-full ${
        resolvedTheme === 'dark'
          ? 'bg-slate-900 text-slate-100 border-slate-700'
          : 'bg-white text-slate-900 border-slate-200'
      }`}>
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="text-xs sm:text-sm text-center sm:text-left">
              <p>&copy; {currentYear} Treesh. All rights reserved.</p>
            </div>
            <div className="flex gap-3 sm:gap-6 text-xs sm:text-sm flex-wrap justify-center">
              <button
                onClick={() => handleNavigate('/about')}
                className="hover:text-primary transition-colors"
              >
                About
              </button>
              <button
                onClick={() => handleNavigate('/terms')}
                className="hover:text-primary transition-colors"
              >
                Terms
              </button>
              <button
                onClick={() => handleNavigate('/privacy')}
                className="hover:text-primary transition-colors"
              >
                Privacy
              </button>
              <button
                onClick={() => handleNavigate('/support')}
                className="hover:text-primary transition-colors"
              >
                Support
              </button>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`transition-colors duration-300 border-t rounded-t-2xl overflow-hidden w-full ${
      resolvedTheme === 'dark'
        ? 'bg-slate-900 text-slate-100 border-slate-700'
        : 'bg-white text-slate-900 border-slate-200'
    }`}>
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-base sm:text-lg">T</span>
              </div>
              <h3 className={`text-xl sm:text-2xl font-bold ${
                resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>Treesh</h3>
            </div>
            <p className={`text-xs sm:text-sm leading-relaxed max-w-xs ${
              resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Connect, Share, and Stream with people around the world.
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className={`h-9 w-9 sm:h-10 sm:w-10 p-0 hover:text-primary transition rounded-full flex-shrink-0 ${
                  resolvedTheme === 'dark'
                    ? 'text-slate-400 hover:bg-slate-800'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
                onClick={() => handleSocialClick('Facebook')}
                title="Follow us on Facebook"
              >
                <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-9 w-9 sm:h-10 sm:w-10 p-0 hover:text-primary transition rounded-full flex-shrink-0 ${
                  resolvedTheme === 'dark'
                    ? 'text-slate-400 hover:bg-slate-800'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
                onClick={() => handleSocialClick('Twitter')}
                title="Follow us on Twitter"
              >
                <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-9 w-9 sm:h-10 sm:w-10 p-0 hover:text-primary transition rounded-full flex-shrink-0 ${
                  resolvedTheme === 'dark'
                    ? 'text-slate-400 hover:bg-slate-800'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
                onClick={() => handleSocialClick('Instagram')}
                title="Follow us on Instagram"
              >
                <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-9 w-9 sm:h-10 sm:w-10 p-0 hover:text-primary transition rounded-full flex-shrink-0 ${
                  resolvedTheme === 'dark'
                    ? 'text-slate-400 hover:bg-slate-800'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
                onClick={() => handleSocialClick('YouTube')}
                title="Subscribe on YouTube"
              >
                <Youtube className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className={`text-sm sm:text-base font-semibold mb-3 sm:mb-4 ${
              resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>Quick Links</h4>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <button
                  onClick={() => handleNavigate('/about')}
                  className={`text-xs sm:text-sm hover:text-primary transition-colors duration-200 ${
                    resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigate('/terms')}
                  className={`text-xs sm:text-sm hover:text-primary transition-colors duration-200 ${
                    resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigate('/privacy')}
                  className={`text-xs sm:text-sm hover:text-primary transition-colors duration-200 ${
                    resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigate('/support')}
                  className={`text-xs sm:text-sm hover:text-primary transition-colors duration-200 ${
                    resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Support & Help
                </button>
              </li>
            </ul>
          </div>

          {/* Get the App */}
          <div>
            <h4 className={`text-sm sm:text-base font-semibold mb-3 sm:mb-4 ${
              resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>Get the App</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                className={`w-full justify-start text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-3 transition-colors ${
                  resolvedTheme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200 hover:text-slate-900'
                }`}
                onClick={() => handleDownload('iOS')}
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span>iOS</span>
              </Button>
              <Button
                variant="outline"
                className={`w-full justify-start text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-3 transition-colors ${
                  resolvedTheme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200 hover:text-slate-900'
                }`}
                onClick={() => handleDownload('Android')}
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span>Android</span>
              </Button>
            </div>
          </div>

          {/* Follow Us / Contact */}
          <div>
            <h4 className={`text-sm sm:text-base font-semibold mb-3 sm:mb-4 ${
              resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>Contact</h4>
            <div className="space-y-2 sm:space-y-3">
              <p className={`text-xs sm:text-sm ${
                resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Connect with us for updates.
              </p>
              <a
                href="mailto:support@treesh.com"
                className={`flex items-center gap-2 text-xs sm:text-sm hover:text-primary transition-colors break-all ${
                  resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>support@treesh.com</span>
              </a>
              <a
                href="tel:+1-800-TREESH"
                className={`flex items-center gap-2 text-xs sm:text-sm hover:text-primary transition-colors ${
                  resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>1-800-TREESH</span>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className={`my-6 sm:my-8 ${
          resolvedTheme === 'dark' ? 'border-t border-slate-700' : 'border-t border-slate-200'
        }`} />

        {/* Bottom Section */}
        <div className={`flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-xs sm:text-sm ${
          resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
        }`}>
          <p className="text-center sm:text-left">&copy; {currentYear} Treesh. All rights reserved.</p>
          <div className="flex gap-3 sm:gap-6 flex-wrap justify-center">
            <button
              onClick={() => handleNavigate('/about')}
              className="hover:text-primary transition-colors"
            >
              About
            </button>
            <button
              onClick={() => handleNavigate('/terms')}
              className="hover:text-primary transition-colors"
            >
              Terms
            </button>
            <button
              onClick={() => handleNavigate('/privacy')}
              className="hover:text-primary transition-colors"
            >
              Privacy
            </button>
            <button
              onClick={() => handleNavigate('/support')}
              className="hover:text-primary transition-colors"
            >
              Support
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
