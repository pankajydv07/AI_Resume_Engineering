"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserButton, useAuth, SignedIn, SignedOut } from "@clerk/nextjs";
import { 
  Sparkles, 
  LayoutDashboard, 
  Settings, 
  Home,
  Menu,
  X,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  { label: "Home", href: "/", icon: <Home className="w-4 h-4" /> },
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" />, requiresAuth: true },
  { label: "Settings", href: "/dashboard/settings", icon: <Settings className="w-4 h-4" />, requiresAuth: true },
];

export function FloatingNavbar() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hide navbar on editor page (it has its own header)
  const isEditorPage = pathname?.includes("/editor");
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Don't render on editor pages
  if (isEditorPage) return null;

  const filteredNavItems = navItems.filter(item => 
    !item.requiresAuth || (item.requiresAuth && isSignedIn)
  );

  return (
    <>
      {/* Desktop Floating Navbar */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed top-4 left-1/2 -translate-x-1/2 z-50",
          "hidden md:flex items-center gap-2",
          "px-2 py-2 rounded-2xl",
          "backdrop-blur-xl border",
          "transition-all duration-300",
          isScrolled 
            ? "bg-gray-900/80 border-gray-700/50 shadow-2xl shadow-black/20" 
            : "bg-gray-900/60 border-gray-700/30 shadow-lg shadow-black/10"
        )}
      >
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group"
        >
          <motion.div 
            className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </motion.div>
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            ResumeAI
          </span>
        </Link>

        {/* Separator */}
        <div className="w-px h-6 bg-gray-700/50" />

        {/* Nav Items */}
        <div className="flex items-center gap-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/" && pathname?.startsWith(item.href));
            
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                    isActive 
                      ? "text-white" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active"
                      className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-xl border border-blue-500/20"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.icon}</span>
                  <span className="relative z-10">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-gray-700/50" />

        {/* Auth Section */}
        <div className="flex items-center gap-2 px-2">
          <SignedIn>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 ring-2 ring-blue-500/20 hover:ring-blue-500/40 transition-all",
                }
              }}
            />
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in">
              <motion.button
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Sign In
              </motion.button>
            </Link>
            <Link href="/sign-up">
              <motion.button
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
              </motion.button>
            </Link>
          </SignedOut>
        </div>
      </motion.nav>

      {/* Mobile Navbar */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "fixed top-4 left-4 right-4 z-50",
          "md:hidden flex items-center justify-between",
          "px-4 py-3 rounded-2xl",
          "backdrop-blur-xl border",
          "transition-all duration-300",
          isScrolled 
            ? "bg-gray-900/80 border-gray-700/50 shadow-2xl" 
            : "bg-gray-900/60 border-gray-700/30 shadow-lg"
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            ResumeAI
          </span>
        </Link>

        {/* Mobile Menu Button */}
        <motion.button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <Menu className="w-5 h-5 text-white" />
          )}
        </motion.button>
      </motion.nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-20 left-4 right-4 z-40 md:hidden"
          >
            <div className="p-4 rounded-2xl backdrop-blur-xl bg-gray-900/90 border border-gray-700/50 shadow-2xl">
              <div className="space-y-2">
                {filteredNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-between px-4 py-3 rounded-xl transition-colors",
                          isActive 
                            ? "bg-blue-600/20 text-white border border-blue-500/20" 
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {item.icon}
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Auth */}
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <SignedIn>
                  <div className="flex items-center gap-3 px-4 py-2">
                    <UserButton 
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          avatarBox: "w-10 h-10",
                        }
                      }}
                    />
                    <span className="text-sm text-gray-400">Manage Account</span>
                  </div>
                </SignedIn>
                <SignedOut>
                  <div className="space-y-2">
                    <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                      <div className="px-4 py-3 text-center text-gray-300 rounded-xl hover:bg-white/5 transition-colors">
                        Sign In
                      </div>
                    </Link>
                    <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                      <div className="px-4 py-3 text-center text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-medium">
                        Get Started
                      </div>
                    </Link>
                  </div>
                </SignedOut>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
