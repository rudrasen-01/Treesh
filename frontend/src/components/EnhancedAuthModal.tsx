import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { authAPI } from "@/services/api";
import { usersAPI } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { getApiBaseUrl } from "@/config/env";
import {
  Phone,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle,
  Shield,
} from "lucide-react";

interface EnhancedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

interface ValidationErrors {
  fullName?: string;
  username?: string;
  email?: string;
  mobileNumber?: string;
  password?: string;
  confirmPassword?: string;
  identifier?: string;
  loginPassword?: string;
}

// Validation utilities
const VALIDATION_RULES = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  fullName: /^[a-zA-Z\s'-]{2,50}$/,
  phone: /^[+]?[0-9]{10,}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,
};

const validateEmail = (email: string): string | undefined => {
  const trimmed = email.trim();
  if (!trimmed) return "Email is required";
  if (trimmed.length > 120) return "Email is too long";
  if (!VALIDATION_RULES.email.test(trimmed)) return "Please enter a valid email address";
  return undefined;
};

const validateFullName = (name: string): string | undefined => {
  const trimmed = name.trim();
  if (!trimmed) return "Full name is required";
  if (trimmed.length < 2) return "Full name must be at least 2 characters";
  if (trimmed.length > 50) return "Full name must not exceed 50 characters";
  if (!VALIDATION_RULES.fullName.test(trimmed)) return "Full name should only contain letters, spaces, hyphens, and apostrophes";
  // Check for multiple consecutive spaces
  if (/  +/.test(trimmed)) return "Full name should not contain multiple consecutive spaces";
  return undefined;
};

const validateUsername = (username: string): string | undefined => {
  const trimmed = username.trim();
  if (!trimmed) return "Username is required";
  if (trimmed.length < 3) return "Username must be at least 3 characters";
  if (trimmed.length > 20) return "Username cannot exceed 20 characters";
  if (!VALIDATION_RULES.username.test(trimmed)) return "Username can only contain letters, numbers, and underscores";
  return undefined;
};

const validatePhone = (phone: string, countryCode?: string): string | undefined => {
  if (!phone) return undefined; // Phone is optional
  const trimmed = phone.trim();
  if (trimmed.length === 0) return undefined; // Optional field
  
  // Country-specific phone length validation
  const phoneLengthLimits: Record<string, { min: number; max: number }> = {
    IN: { min: 10, max: 10 }, // India: 10 digits
    US: { min: 10, max: 10 }, // US: 10 digits
    GB: { min: 10, max: 11 }, // UK: 10-11 digits
    CA: { min: 10, max: 10 }, // Canada: 10 digits
    AU: { min: 9, max: 9 },   // Australia: 9 digits
    NZ: { min: 9, max: 10 },  // New Zealand: 9-10 digits
    SG: { min: 8, max: 8 },   // Singapore: 8 digits
    MY: { min: 9, max: 10 },  // Malaysia: 9-10 digits
    PK: { min: 10, max: 10 }, // Pakistan: 10 digits
    BD: { min: 10, max: 10 }, // Bangladesh: 10 digits
    AE: { min: 9, max: 9 },   // UAE: 9 digits
    SA: { min: 9, max: 9 },   // Saudi Arabia: 9 digits
    DE: { min: 10, max: 13 }, // Germany: 10-13 digits
    FR: { min: 9, max: 9 },   // France: 9 digits
    IT: { min: 10, max: 10 }, // Italy: 10 digits
    ES: { min: 9, max: 9 },   // Spain: 9 digits
    JP: { min: 10, max: 11 }, // Japan: 10-11 digits
    CN: { min: 10, max: 11 }, // China: 10-11 digits
  };

  const limits = countryCode ? phoneLengthLimits[countryCode] : { min: 10, max: 15 };
  
  if (trimmed.length < (limits?.min || 10)) {
    return `Phone number should be at least ${limits?.min || 10} digits`;
  }
  if (trimmed.length > (limits?.max || 15)) {
    return `Phone number should not exceed ${limits?.max || 15} digits`;
  }
  
  return undefined;
};

const validatePassword = (password: string): string | undefined => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!VALIDATION_RULES.password.test(password)) 
    return "Password must contain uppercase, lowercase, number, and special character";
  return undefined;
};

const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
  if (!confirmPassword) return "Please confirm your password";
  if (password !== confirmPassword) return "Passwords do not match";
  return undefined;
};

const validateIdentifier = (identifier: string): string | undefined => {
  const trimmed = identifier.trim();
  if (!trimmed) return "Email or username is required";
  if (trimmed.length < 3) return "Please enter a valid email or username";
  return undefined;
};

const validateLoginPassword = (password: string): string | undefined => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return undefined;
};

// Country code data with phone prefixes
const COUNTRY_CODES = [
  { code: "IN", name: "India", prefix: "+91" },
  { code: "US", name: "United States", prefix: "+1" },
  { code: "GB", name: "United Kingdom", prefix: "+44" },
  { code: "CA", name: "Canada", prefix: "+1" },
  { code: "AU", name: "Australia", prefix: "+61" },
  { code: "NZ", name: "New Zealand", prefix: "+64" },
  { code: "SG", name: "Singapore", prefix: "+65" },
  { code: "MY", name: "Malaysia", prefix: "+60" },
  { code: "PK", name: "Pakistan", prefix: "+92" },
  { code: "BD", name: "Bangladesh", prefix: "+880" },
  { code: "AE", name: "United Arab Emirates", prefix: "+971" },
  { code: "SA", name: "Saudi Arabia", prefix: "+966" },
  { code: "DE", name: "Germany", prefix: "+49" },
  { code: "FR", name: "France", prefix: "+33" },
  { code: "IT", name: "Italy", prefix: "+39" },
  { code: "ES", name: "Spain", prefix: "+34" },
  { code: "JP", name: "Japan", prefix: "+81" },
  { code: "CN", name: "China", prefix: "+86" },
];

export const EnhancedAuthModal = ({
  isOpen,
  onClose,
  onLogin,
}: EnhancedAuthModalProps) => {
  const [activeTab, setActiveTab] = useState("login");
  const [loginData, setLoginData] = useState({ identifier: "", password: "" });
  const [registerData, setRegisterData] = useState({
    fullName: "",
    username: "",
    email: "",
    countryCode: "IN",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // OTP verification states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [resendOtpDisabled, setResendOtpDisabled] = useState(false);

  // Legal Modals
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const { login, register } = useAuth();

  // Real-time validation for login form
  const validateLoginForm = () => {
    const errors: ValidationErrors = {};
    errors.identifier = validateIdentifier(loginData.identifier);
    errors.loginPassword = validateLoginPassword(loginData.password);
    setValidationErrors(errors);
    return !errors.identifier && !errors.loginPassword;
  };

  // Real-time validation for register form
  const validateRegisterForm = () => {
    const errors: ValidationErrors = {};
    errors.fullName = validateFullName(registerData.fullName);
    errors.username = validateUsername(registerData.username);
    errors.email = validateEmail(registerData.email);
    errors.mobileNumber = validatePhone(registerData.mobileNumber, registerData.countryCode);
    errors.password = validatePassword(registerData.password);
    errors.confirmPassword = validateConfirmPassword(registerData.password, registerData.confirmPassword);
    setValidationErrors(errors);
    return !Object.values(errors).some(error => error !== undefined);
  };

  // Handle blur event to mark field as touched
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Handle input change with real-time validation
  const handleLoginInputChange = (field: string, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation
    if (touched[field]) {
      const errors: ValidationErrors = { ...validationErrors };
      if (field === "identifier") {
        errors.identifier = validateIdentifier(value);
      } else if (field === "password") {
        errors.loginPassword = validateLoginPassword(value);
      }
      setValidationErrors(errors);
    }
  };

  // Handle register input change with real-time validation
  const handleRegisterInputChange = (field: string, value: string) => {
    let finalValue = value;

    // Special handling for specific fields  
    if (field === "fullName") {
      // Allow spaces between names but prevent multiple consecutive spaces
      finalValue = value.replace(/  +/g, " ");
    } else if (field === "username") {
      // Trim and filter invalid characters from username
      finalValue = value.trim().replace(/[^a-zA-Z0-9_]/g, "");
    } else if (field === "email") {
      // Normalize email to lowercase
      finalValue = value.toLowerCase();
    } else if (field === "mobileNumber") {
      // Only allow digits
      finalValue = value.replace(/[^\d]/g, "");
    }

    setRegisterData(prev => ({ ...prev, [field]: finalValue }));

    // Real-time validation if field is touched
    if (touched[field]) {
      const errors: ValidationErrors = { ...validationErrors };
      switch (field) {
        case "fullName":
          errors.fullName = validateFullName(finalValue);
          break;
        case "username":
          errors.username = validateUsername(finalValue);
          break;
        case "email":
          errors.email = validateEmail(finalValue);
          break;
        case "mobileNumber":
          errors.mobileNumber = validatePhone(finalValue, registerData.countryCode);
          break;
        case "password":
          errors.password = validatePassword(finalValue);
          errors.confirmPassword = registerData.confirmPassword 
            ? validateConfirmPassword(finalValue, registerData.confirmPassword)
            : undefined;
          break;
        case "confirmPassword":
          errors.confirmPassword = validateConfirmPassword(registerData.password, finalValue);
          break;
        default:
          break;
      }
      setValidationErrors(errors);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      // Set demo token in localStorage
      localStorage.setItem("token", "demo-token");

      toast({
        title: "Success",
        description: "Demo login successful! Refreshing page...",
      });

      onLogin();
      onClose();

      // Refresh the page to trigger auth check
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Demo login failed.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength validator
  const updatePasswordStrength = (password: string) => {
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    });
  };

  // Debounced check if username exists
  useEffect(() => {
    if (!registerData.username || registerData.username.length < 3) {
      // Clear username error if too short
      setValidationErrors(prev => ({
        ...prev,
        username: undefined
      }));
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    
    const timeout = setTimeout(async () => {
      try {
        const response = await authAPI.checkUsername(registerData.username);
        if (response.success) {
          if (!response.data?.available) {
            // Username is taken - show error
            setValidationErrors(prev => ({
              ...prev,
              username: "⚠️ Username already taken"
            }));
            setTouched(prev => ({
              ...prev,
              username: true
            }));
          } else {
            // Username is available - clear error
            setValidationErrors(prev => ({
              ...prev,
              username: undefined
            }));
          }
        }
      } catch (error) {
        // Silently fail on error
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500); // Debounce for 500ms

    return () => {
      clearTimeout(timeout);
      setIsCheckingUsername(false);
    };
  }, [registerData.username]);

  // Debounced check if phone exists
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!registerData.mobileNumber || registerData.mobileNumber.length < 10) {
        return;
      }
      try {
        const response = await authAPI.checkPhone(registerData.mobileNumber);
        if (response.success && !response.data?.available) {
          setValidationErrors(prev => ({
            ...prev,
            mobileNumber: "Phone number already in use"
          }));
        }
      } catch (error) {
        // Silently fail
      }
    }, 600); // Debounce for 600ms

    return () => clearTimeout(timeout);
  }, [registerData.mobileNumber]);

  // Revalidate phone when country code changes
  useEffect(() => {
    if (touched["mobileNumber"] && registerData.mobileNumber) {
      const error = validatePhone(registerData.mobileNumber, registerData.countryCode);
      setValidationErrors(prev => ({
        ...prev,
        mobileNumber: error
      }));
    }
  }, [registerData.countryCode]);

  // Start OTP countdown timer
  const startOtpTimer = () => {
    setOtpTimer(60);
    setResendOtpDisabled(true);
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setResendOtpDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Send OTP
  const handleSendOtp = async () => {
    // Mark all fields as touched for error display
    setTouched({
      fullName: true,
      username: true,
      email: true,
      mobileNumber: true,
      password: true,
      confirmPassword: true,
    });

    // Validate all fields
    if (!validateRegisterForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill all fields correctly before requesting OTP.",
        variant: "destructive",
      });
      return;
    }

    // Additional check: at least email or mobile is provided
    if (!registerData.email && !registerData.mobileNumber) {
      toast({
        title: "Error",
        description:
          "Please provide either email or mobile number to receive OTP",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Determine identifier and type
      const identifier = registerData.email || registerData.mobileNumber;
      const type = registerData.email ? "email" : "sms";

      // Call backend API to send OTP
      const response = await fetch(
        `${getApiBaseUrl()}/auth/send-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier,
            type,
            purpose: "registration",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setOtpSent(true);
      startOtpTimer();
      toast({
        title: "OTP Sent! ✅",
        description: `Verification code has been sent to ${
          type === "email" ? "your email" : "your mobile number"
        }. Check your ${type === "email" ? "inbox" : "messages"}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendOtpDisabled) return;
    await handleSendOtp();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    // Mark all fields as touched for error display
    setTouched({ identifier: true, password: true });
    
    // Validate form
    if (!validateLoginForm()) {
      setLoginError("Please fill in all fields correctly");
      toast({
        title: "Form Incomplete",
        description: "Please enter both email/username and password",
        variant: "destructive",
      });
      return;
    }

    // Check if email/username is valid format
    const identifier = loginData.identifier.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isUsername = /^[a-zA-Z0-9_]{3,20}$/.test(identifier);

    if (!isEmail && !isUsername) {
      setLoginError("Please enter a valid email address or username (3-20 characters)");
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(identifier, loginData.password);
      if (success) {
        toast({
          title: "Success!",
          description: "Welcome back to Treesh!",
        });
        // Reset form
        setLoginData({ identifier: "", password: "" });
        setTouched({});
        setValidationErrors({});
        setLoginError(null);
        onLogin();
      } else {
        setLoginError("Invalid email/username or password. Please try again.");
        toast({
          title: "Login Failed",
          description: "The credentials you entered are incorrect. Please verify and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      let errorMessage = "Something went wrong while logging in. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("Unauthorized")) {
          errorMessage = "Invalid email/username or password. Please check and try again.";
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else if (error.message.includes("404")) {
          errorMessage = "User not found. Please check your email/username and try again.";
        } else {
          errorMessage = error.message || errorMessage;
        }
      }
      
      setLoginError(errorMessage);
      toast({
        title: "Login Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordFormat = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched for error display
    setTouched({
      fullName: true,
      username: true,
      email: true,
      mobileNumber: true,
      password: true,
      confirmPassword: true,
    });

    // Validate form
    if (!validateRegisterForm()) {
      toast({
        title: "Validation Error",
        description: "Please check the highlighted fields and try again.",
        variant: "destructive",
      });
      return;
    }

    // Additional validation: OTP
    if (!otpSent || !otpCode) {
      toast({
        title: "OTP Verification Required",
        description: "Please verify your email with OTP first.",
        variant: "destructive",
      });
      return;
    }

    if (otpCode.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "OTP must be 6 digits.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Verify OTP first
      const identifier = registerData.email.trim();
      const otpVerifyResponse = await fetch(
        `${getApiBaseUrl()}/auth/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier,
            purpose: "registration",
            code: otpCode,
          }),
        }
      );

      const otpData = await otpVerifyResponse.json();

      if (!otpVerifyResponse.ok) {
        toast({
          title: "Invalid OTP",
          description: otpData.error || "Please check your OTP code and try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Step 2: Check availability: username
      const usernameCheck = await authAPI.checkUsername(registerData.username);
      // Custom username check: allow same name if surname is different
      const [name, ...surnameArr] = registerData.fullName.trim().split(" ");
      const surname = surnameArr.join(" ");
      if (!usernameCheck.success || usernameCheck.data?.available === false) {
        // Fetch users with the same username
        const searchRes = await usersAPI.searchUsers(registerData.username);
        if (searchRes.success && Array.isArray(searchRes.data)) {
          const conflict = searchRes.data.find((u: any) => {
            if (!u.fullName) return false;
            const [existingName, ...existingSurnameArr] = u.fullName.trim().split(" ");
            const existingSurname = existingSurnameArr.join(" ");
            // Block only if both name and surname match
            return (
              existingName.toLowerCase() === name.toLowerCase() &&
              existingSurname.toLowerCase() === surname.toLowerCase()
            );
          });
          if (conflict) {
            toast({
              title: "Username taken",
              description: "A user with this name and surname already exists. Please choose a different username or surname.",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
        } else {
          toast({
            title: "Username taken",
            description: "Please choose a different username.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }
      // Check email
      const emailCheck = await authAPI.checkEmail(registerData.email);
      if (!emailCheck.success || emailCheck.data?.available === false) {
        toast({
          title: "Email already registered",
          description: "Try logging in or use another email.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      // Check phone if provided
      if (registerData.mobileNumber) {
        const phoneCheck = await authAPI.checkPhone(registerData.mobileNumber);
        if (!phoneCheck.success || phoneCheck.data?.available === false) {
          toast({
            title: "Phone already in use",
            description: "Use another number or log in.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      const success = await register(
        registerData.fullName.trim(),
        registerData.username.trim(),
        registerData.email.trim(),
        registerData.password,
        registerData.confirmPassword
      );
      if (success) {
        toast({
          title: "Success!",
          description: "Welcome to Treesh! Your account has been created.",
        });
        // Reset form
        setRegisterData({
          fullName: "",
          username: "",
          email: "",
          countryCode: "IN",
          mobileNumber: "",
          password: "",
          confirmPassword: "",
        });
        setTouched({});
        setValidationErrors({});
        setOtpSent(false);
        setOtpCode("");
        onLogin();
      } else {
        toast({
          title: "Registration Failed",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setOtpSent(false);
    setOtpCode("");
    setOtpTimer(0);
    setResendOtpDisabled(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setTouched({});
    setValidationErrors({});
    setLoginError(null);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-1rem)] sm:max-w-lg lg:max-w-xl xl:max-w-2xl bg-offwhite max-h-[92vh] overflow-hidden p-0 transition-all duration-300 flex flex-col">
        <div className="px-4 sm:px-6 pt-4 sm:pt-6">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl lg:text-3xl font-bold text-foreground font-treesh">
              Welcome to Treesh
            </DialogTitle>
            <DialogDescription className="sr-only">
              Login or create an account to continue.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 transition-all duration-300 ease-out">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
          <TabsList className="grid w-full grid-cols-2 bg-muted p-1">
            <TabsTrigger
              value="login"
              className="data-[state=active]:bg-offwhite data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"
            >
              Login
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="data-[state=active]:bg-offwhite data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-6 animate-in fade-in-50 duration-300">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Login Error Alert */}
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex gap-3 animate-in fade-in-50 duration-300">
                  <div className="text-red-500 flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-red-700 font-medium">Login Failed</p>
                    <p className="text-xs text-red-600 mt-1">{loginError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLoginError(null)}
                    className="text-red-400 hover:text-red-600 flex-shrink-0 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="login-identifier"
                  className="text-sm font-medium text-gray-700"
                >
                  Email or Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="login-identifier"
                    type="text"
                    autoComplete="username"
                    placeholder="Enter your email or username"
                    value={loginData.identifier}
                    onChange={(e) => handleLoginInputChange("identifier", e.target.value)}
                    onBlur={() => handleBlur("identifier")}
                    className={`pl-10 bg-background border-border focus:border-primary focus:ring-primary transition-all duration-200 ${
                      touched["identifier"] && validationErrors.identifier ? "border-red-500 focus:border-red-500" : ""
                    }`}
                  />
                </div>
                {touched["identifier"] && validationErrors.identifier && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.identifier}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="login-password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => handleLoginInputChange("password", e.target.value)}
                    onBlur={() => handleBlur("password")}
                    className={`pl-10 bg-background border-border focus:border-primary focus:ring-primary transition-all duration-200 ${
                      touched["password"] && validationErrors.loginPassword ? "border-red-500 focus:border-red-500" : ""
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 h-6 w-6 p-0 hover:bg-muted"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {touched["password"] && validationErrors.loginPassword && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.loginPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 text-base transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-6 animate-in fade-in-50 duration-300">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="register-fullname"
                  className="text-sm font-medium text-gray-700"
                >
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="register-fullname"
                    type="text"
                    placeholder="Enter your full name"
                    value={registerData.fullName}
                    onChange={(e) => handleRegisterInputChange("fullName", e.target.value)}
                    onBlur={() => handleBlur("fullName")}
                    className={`pl-10 bg-background border-border focus:border-primary focus:ring-primary transition-all duration-200 ${
                      touched["fullName"] && validationErrors.fullName ? "border-red-500 focus:border-red-500" : ""
                    }`}
                  />
                </div>
                {touched["fullName"] && validationErrors.fullName && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="register-username"
                  className="text-sm font-medium text-gray-700"
                >
                  Username <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="Choose a username"
                    value={registerData.username}
                    onChange={(e) => handleRegisterInputChange("username", e.target.value)}
                    onBlur={() => handleBlur("username")}
                    className={`pl-10 pr-10 bg-background border-border focus:border-primary focus:ring-primary transition-all duration-200 ${
                      touched["username"] && validationErrors.username ? "border-red-500 focus:border-red-500" : ""
                    }`}
                  />
                  {isCheckingUsername && (
                    <div className="absolute right-3 top-3 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  )}
                  {!isCheckingUsername && registerData.username && registerData.username.length >= 3 && !validationErrors.username && (
                    <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                  )}
                  {validationErrors.username && (
                    <div className="absolute right-3 top-3 text-red-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                {touched["username"] && validationErrors.username && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="register-email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Enter your email"
                    value={registerData.email}
                    onChange={(e) => handleRegisterInputChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    className={`pl-10 bg-background border-border focus:border-primary focus:ring-primary transition-all duration-200 ${
                      touched["email"] && validationErrors.email ? "border-red-500 focus:border-red-500" : ""
                    }`}
                  />
                </div>
                {touched["email"] && validationErrors.email && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="register-mobile"
                  className="text-sm font-medium text-gray-700"
                >
                  Mobile Number{" "}
                  <span className="text-gray-400 text-xs">(Optional)</span>
                </Label>
                <div className="flex gap-2">
                  {/* Country Code Selector */}
                  <select
                    value={registerData.countryCode}
                    onChange={(e) =>
                      setRegisterData((prev) => ({
                        ...prev,
                        countryCode: e.target.value,
                      }))
                    }
                    className="px-3 py-2 bg-background border border-border rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary w-32 flex-shrink-0"
                  >
                    {COUNTRY_CODES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name} {country.prefix}
                      </option>
                    ))}
                  </select>

                  {/* Mobile Number Input */}
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-mobile"
                      type="tel"
                      placeholder={(() => {
                        const limits = {
                          IN: "10 digits",
                          US: "10 digits",
                          GB: "10-11 digits",
                          CA: "10 digits",
                          AU: "9 digits",
                          NZ: "9-10 digits",
                          SG: "8 digits",
                          MY: "9-10 digits",
                          PK: "10 digits",
                          BD: "10 digits",
                          AE: "9 digits",
                          SA: "9 digits",
                          DE: "10-13 digits",
                          FR: "9 digits",
                          IT: "10 digits",
                          ES: "9 digits",
                          JP: "10-11 digits",
                          CN: "10-11 digits",
                        };
                        return `Enter ${limits[registerData.countryCode as keyof typeof limits] || "phone number"}`;
                      })()}
                      value={registerData.mobileNumber}
                      onChange={(e) => handleRegisterInputChange("mobileNumber", e.target.value)}
                      onBlur={() => handleBlur("mobileNumber")}
                      maxLength={(() => {
                        const limits: Record<string, number> = {
                          IN: 10,
                          US: 10,
                          GB: 11,
                          CA: 10,
                          AU: 9,
                          NZ: 10,
                          SG: 8,
                          MY: 10,
                          PK: 10,
                          BD: 10,
                          AE: 9,
                          SA: 9,
                          DE: 13,
                          FR: 9,
                          IT: 10,
                          ES: 9,
                          JP: 11,
                          CN: 11,
                        };
                        return limits[registerData.countryCode] || 15;
                      })()}
                      className={`pl-10 bg-background border-border focus:border-primary focus:ring-primary transition-all duration-200 ${
                        touched["mobileNumber"] && validationErrors.mobileNumber ? "border-red-500 focus:border-red-500" : ""
                      }`}
                    />
                  </div>
                </div>
                {touched["mobileNumber"] && validationErrors.mobileNumber && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.mobileNumber}</p>
                )}
                {registerData.mobileNumber && !validationErrors.mobileNumber && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {COUNTRY_CODES.find(c => c.code === registerData.countryCode)?.prefix} {registerData.mobileNumber}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="register-password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={registerData.password}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleRegisterInputChange("password", value);
                      updatePasswordStrength(value);
                    }}
                    onBlur={() => handleBlur("password")}
                    className={`pl-10 bg-background border-border focus:border-primary focus:ring-primary transition-all duration-200 ${
                      touched["password"] && validationErrors.password ? "border-red-500 focus:border-red-500" : ""
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 h-6 w-6 p-0 hover:bg-muted"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                
                {/* Password Strength Indicator */}
                {registerData.password && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-md space-y-2 border border-border animate-in fade-in-50 duration-300">
                    <p className="text-xs font-medium text-gray-700">Password must contain:</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 transition-colors duration-200">
                        <CheckCircle className={`w-4 h-4 transition-colors duration-300 ${passwordStrength.hasMinLength ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={`text-xs transition-colors duration-300 ${passwordStrength.hasMinLength ? 'text-green-700' : 'text-gray-500'}`}>
                          At least 8 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2 transition-colors duration-200">
                        <CheckCircle className={`w-4 h-4 transition-colors duration-300 ${passwordStrength.hasUpperCase ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={`text-xs transition-colors duration-300 ${passwordStrength.hasUpperCase ? 'text-green-700' : 'text-gray-500'}`}>
                          One uppercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2 transition-colors duration-200">
                        <CheckCircle className={`w-4 h-4 transition-colors duration-300 ${passwordStrength.hasLowerCase ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={`text-xs transition-colors duration-300 ${passwordStrength.hasLowerCase ? 'text-green-700' : 'text-gray-500'}`}>
                          One lowercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2 transition-colors duration-200">
                        <CheckCircle className={`w-4 h-4 transition-colors duration-300 ${passwordStrength.hasNumber ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={`text-xs transition-colors duration-300 ${passwordStrength.hasNumber ? 'text-green-700' : 'text-gray-500'}`}>
                          One number
                        </span>
                      </div>
                      <div className="flex items-center gap-2 transition-colors duration-200">
                        <CheckCircle className={`w-4 h-4 transition-colors duration-300 ${passwordStrength.hasSpecialChar ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={`text-xs transition-colors duration-300 ${passwordStrength.hasSpecialChar ? 'text-green-700' : 'text-gray-500'}`}>
                          One special character (!@#$%^&*)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {touched["password"] && validationErrors.password && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="register-confirm-password"
                  className="text-sm font-medium text-gray-700"
                >
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="register-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    value={registerData.confirmPassword}
                    onChange={(e) => handleRegisterInputChange("confirmPassword", e.target.value)}
                    onBlur={() => handleBlur("confirmPassword")}
                    className={`pl-10 bg-background border-border focus:border-primary focus:ring-primary transition-all duration-200 ${
                      touched["confirmPassword"] && validationErrors.confirmPassword ? "border-red-500 focus:border-red-500" : ""
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 h-6 w-6 p-0 hover:bg-muted"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {(touched["confirmPassword"] && validationErrors.confirmPassword) ||
                (registerData.confirmPassword && registerData.password !== registerData.confirmPassword && touched["confirmPassword"]) ? (
                  <p className="text-xs text-red-500 mt-1">
                    {validationErrors.confirmPassword || "Passwords do not match"}
                  </p>
                ) : null}
                {registerData.confirmPassword && 
                 registerData.password === registerData.confirmPassword &&
                 registerData.password.length >= 8 && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Passwords match
                  </p>
                )}
              </div>

              {/* OTP Verification Section */}
              {!otpSent ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendOtp}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 border-primary disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                  disabled={
                    isLoading ||
                    !registerData.fullName ||
                    !registerData.username ||
                    !registerData.email ||
                    !registerData.mobileNumber ||
                    !registerData.password ||
                    !registerData.confirmPassword ||
                    !!validationErrors.fullName ||
                    !!validationErrors.username ||
                    !!validationErrors.email ||
                    !!validationErrors.mobileNumber ||
                    !!validationErrors.password ||
                    !!validationErrors.confirmPassword ||
                    registerData.password !== registerData.confirmPassword
                  }
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send OTP for Verification
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Label className="text-sm font-medium text-blue-900">
                      OTP Verification <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {otpTimer > 0 && (
                        <span className="text-xs text-blue-600">
                          Resend in {otpTimer}s
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleResendOtp}
                        disabled={resendOtpDisabled}
                        className="text-xs h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                      >
                        Resend OTP
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(
                          e.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
                      maxLength={6}
                      className="h-10 text-center text-lg font-mono tracking-widest bg-background border-border focus:border-primary focus:ring-primary transition-all duration-200"
                      required
                    />
                    {otpCode.length === 6 && (
                      <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                    )}
                  </div>

                  <p className="text-xs text-blue-600">
                    OTP sent to:{" "}
                    {registerData.email || registerData.mobileNumber}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 text-base transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed"
                disabled={isLoading || !otpSent || otpCode.length !== 6}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
            </div>
        </div>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-border text-center text-xs sm:text-sm text-muted-foreground">
          <p className="pt-4">
            By continuing, you agree to our{" "}
            <button
              onClick={() => setShowTermsModal(true)}
              className="text-primary hover:underline cursor-pointer transition-colors duration-200"
            >
              Terms of Service
            </button>
            {" "}and{" "}
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="text-primary hover:underline cursor-pointer transition-colors duration-200"
            >
              Privacy Policy
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>

    {/* Terms of Service Modal */}
    <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
      <DialogContent className="w-[calc(100%-1rem)] sm:max-w-2xl bg-offwhite max-h-[92vh] overflow-hidden p-0 transition-all duration-300 flex flex-col">
        <div className="px-4 sm:px-6 pt-4 sm:pt-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground font-treesh">
              Terms of Service
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6">
          <div className="space-y-4 text-sm text-foreground pb-4">
            <section className="space-y-2">
              <h3 className="font-semibold text-base text-primary">1. Acceptance of Terms</h3>
              <p>By accessing and using Treesh, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-primary">2. Use License</h3>
              <p>Permission is granted to temporarily download one copy of the materials (information or software) on Treesh for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Modifying or copying the materials</li>
                <li>Using the materials for any commercial purpose or for any public display</li>
                <li>Attempting to decompile or reverse engineer any software contained on Treesh</li>
                <li>Removing any copyright or other proprietary notations from the materials</li>
                <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-primary">3. User Accounts</h3>
              <p>When you create an account on Treesh, you are responsible for maintaining the confidentiality of your account information and password. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.</p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-primary">4. User Content</h3>
              <p>You retain all rights to any content you submit, post or display on or through Treesh ("User Content"). By submitting User Content, you grant Treesh a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display and distribute such content in any and all media or distribution methods.</p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-primary">5. Prohibited Conduct</h3>
              <p>You agree not to use Treesh to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Post, transmit, or promote hateful, abusive, or discriminatory content</li>
                <li>Engage in harassment, bullying, or threatening behavior</li>
                <li>Post false, misleading, or defamatory information</li>
                <li>Violate any law or regulation</li>
                <li>Infringe upon intellectual property rights</li>
                <li>Spam or engage in phishing activities</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-primary">6. Limitation of Liability</h3>
              <p>Treesh shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the materials or services, even if we have been advised of the possibility of such damages.</p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-primary">7. Termination</h3>
              <p>Treesh may terminate your access immediately, without prior notice or liability, for any reason whatsoever, including if you breach the Terms. Upon termination, your right to use the service will immediately cease.</p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-primary">8. Changes to Terms</h3>
              <p>Treesh reserves the right to revise these terms at any time. Your continued use of the service following the posting of revised terms means you accept and agree to the changes.</p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-primary">9. Governing Law</h3>
              <p>These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which Treesh operates, and you irrevocably submit to the exclusive jurisdiction of the courts located in that location.</p>
            </section>
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-border flex gap-2">
          <Button variant="outline" onClick={() => setShowTermsModal(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Privacy Policy Modal */}
    <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
      <DialogContent className="w-[calc(100%-1rem)] sm:max-w-2xl bg-offwhite max-h-[92vh] overflow-hidden p-0 transition-all duration-300 flex flex-col">
        <div className="px-4 sm:px-6 pt-4 sm:pt-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground font-treesh">
              Privacy Policy
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6">
          <div className="space-y-4 text-sm text-foreground pb-4">
            <section className="space-y-2">
              <h3 className="font-semibold text-base text-primary">1. Introduction</h3>
              <p>Treesh ("we," "us," or "our") operates the Treesh platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform.</p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-primary">2. Information We Collect</h3>
              <p>We collect information you provide directly, such as:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Account registration information (name, email, phone number, username)</li>
                <li>Profile information and preferences</li>
                <li>Content you create, upload, or share</li>
                <li>Communication data (messages, comments, notifications)</li>
                <li>Payment information and transaction history</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-primary">3. Automatically Collected Information</h3>
              <p>When you use Treesh, we automatically collect:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Device information (device type, operating system, browser type)</li>
                <li>Usage data (features used, content interacted with, search queries)</li>
                <li>IP address and location information</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Log data (access times, pages viewed, referrer information)</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-primary">4. How We Use Your Information</h3>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide, maintain, and improve our services</li>
                <li>Create and manage your account</li>
                <li>Personalize your experience</li>
                <li>Send administrative and promotional communications</li>
                <li>Detect and prevent fraud and abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-primary">5. Data Sharing</h3>
              <p>We do not sell your personal information. We may share your information with:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Service providers who assist in operating our platform</li>
                <li>Other users (as per your privacy settings)</li>
                <li>Legal authorities when required by law</li>
                <li>Business partners with your consent</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-primary">6. Data Security</h3>
              <p>We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.</p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-primary">7. Your Privacy Rights</h3>
              <p>You may have the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Port your data to another service</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-primary">8. Cookies and Tracking</h3>
              <p>We use cookies and similar technologies to enhance your experience. You can control cookie preferences through your browser settings, though some features may not function properly if cookies are disabled.</p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-primary">9. Children's Privacy</h3>
              <p>Treesh is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will delete the information promptly.</p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-base text-primary">10. Contact Us</h3>
              <p>If you have questions about this Privacy Policy or our privacy practices, please contact us at privacy@treesh.com</p>
            </section>
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-border flex gap-2">
          <Button variant="outline" onClick={() => setShowPrivacyModal(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};
