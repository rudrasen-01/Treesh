import { Button } from '@/components/ui/button';
import { Download, Facebook, Twitter, Instagram, Youtube, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface FooterProps {
  variant?: 'full' | 'compact';
}

export const Footer = ({ variant = 'full' }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

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
      <footer className="bg-slate-900 text-slate-100 border-t border-slate-700 rounded-t-2xl overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm">
              <p>&copy; {currentYear} Treesh. All rights reserved.</p>
            </div>
            <div className="flex gap-6 text-sm">
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
    <footer className="bg-slate-900 text-slate-100 border-t border-slate-700 rounded-t-2xl overflow-hidden">
      <div className="w-full px-3 sm:px-4 md:px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Treesh</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Connect, Share, and Stream with people around the world.
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 text-slate-400 hover:text-primary hover:bg-slate-800 transition rounded-full"
                onClick={() => handleSocialClick('Facebook')}
                title="Follow us on Facebook"
              >
                <Facebook className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 text-slate-400 hover:text-primary hover:bg-slate-800 transition rounded-full"
                onClick={() => handleSocialClick('Twitter')}
                title="Follow us on Twitter"
              >
                <Twitter className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 text-slate-400 hover:text-primary hover:bg-slate-800 transition rounded-full"
                onClick={() => handleSocialClick('Instagram')}
                title="Follow us on Instagram"
              >
                <Instagram className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 text-slate-400 hover:text-primary hover:bg-slate-800 transition rounded-full"
                onClick={() => handleSocialClick('YouTube')}
                title="Subscribe on YouTube"
              >
                <Youtube className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleNavigate('/about')}
                  className="text-sm text-slate-400 hover:text-primary transition-colors duration-200"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigate('/terms')}
                  className="text-sm text-slate-400 hover:text-primary transition-colors duration-200"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigate('/privacy')}
                  className="text-sm text-slate-400 hover:text-primary transition-colors duration-200"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigate('/support')}
                  className="text-sm text-slate-400 hover:text-primary transition-colors duration-200"
                >
                  Support & Help
                </button>
              </li>
            </ul>
          </div>

          {/* Get the App */}
          <div>
            <h4 className="text-base font-semibold text-white mb-4">Get the App</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-sm h-10 px-3 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                onClick={() => handleDownload('iOS')}
              >
                <Download className="w-4 h-4 mr-2" />
                Download iOS
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-sm h-10 px-3 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                onClick={() => handleDownload('Android')}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Android
              </Button>
            </div>
          </div>

          {/* Follow Us / Contact */}
          <div>
            <h4 className="text-base font-semibold text-white mb-4">Follow Us</h4>
            <div className="space-y-3">
              <p className="text-sm text-slate-400">
                Connect with us on social media for the latest updates.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white h-9"
                  onClick={() => handleSocialClick('Facebook')}
                >
                  <Facebook className="w-4 h-4 mr-1" />
                  Facebook
                </Button>
                <Button
                  size="sm"
                  className="bg-sky-500 hover:bg-sky-600 text-white h-9"
                  onClick={() => handleSocialClick('Twitter')}
                >
                  <Twitter className="w-4 h-4 mr-1" />
                  Twitter
                </Button>
              </div>
              <div className="pt-2 space-y-2">
                <a
                  href="mailto:support@treesh.com"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  support@treesh.com
                </a>
                <a
                  href="tel:+1-800-TREESH"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-primary transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  1-800-TREESH
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700 my-6" />

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-400">
          <p>&copy; {currentYear} Treesh. All rights reserved.</p>
          <div className="flex gap-6">
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
