"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Box, Package, Zap } from "lucide-react";

export default function HomePage() {
  // Featured modules
  const featuredModules = [
    {
      id: "basic-integration",
      title: "Basic Integration",
      price: 499.99,
      description: "Essential Zoho CRM integration with basic automation features",
      icon: Box
    },
    {
      id: "professional-suite",
      title: "Professional Suite",
      price: 999.00,
      description: "Advanced integration with workflow automation and custom fields",
      icon: Package
    },
    {
      id: "enterprise-package",
      title: "Enterprise Package",
      price: 1499.00,
      description: "Complete integration solution with advanced analytics and API access",
      icon: Zap
    }
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-400 via-purple-400 to-purple-800">
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              viewBox="0 0 1440 320"
              className="w-full h-auto"
              preserveAspectRatio="none"
            >
              <path
                fill="#ffffff"
                fillOpacity="1"
                d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              ></path>
            </svg>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              Your Next Zoho Integration Starts Here
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Discover powerful integration modules to supercharge your Zoho CRM
            </p>
            <Button size="lg" className="bg-white text-purple-700 hover:bg-white/90">
              Browse Modules
            </Button>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">Featured Modules</h2>
            <Link href="/products" className="text-purple-600 hover:text-purple-700">
              View All
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredModules.map((module, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <Link href={`/products/${module.id}`}>
                  <CardContent className="p-6">
                    <div className="h-48 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
                      <module.icon className="w-16 h-16 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{module.title}</h3>
                    <p className="text-gray-600 mb-4">{module.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">${module.price}</span>
                      <Button className="bg-black text-white hover:bg-gray-800">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Modules?</h2>
            <p className="text-lg text-gray-600">
              Built with the latest technology to enhance your Zoho experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Integration</h3>
              <p className="text-gray-600">
                Simple setup process with comprehensive documentation
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Box className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Customizable</h3>
              <p className="text-gray-600">
                Tailor the modules to match your business needs
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">
                Dedicated support team to help you succeed
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
