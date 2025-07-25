"use client"

import { useState, useEffect } from "react"
import { Search, MapPin, Settings2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { loadGoogleMaps } from "@/lib/google-maps"
import Image from "next/image"

interface SearchSectionProps {
  onSearch: (query: string) => void
  userLocation: string
  onLocationClick: () => void
  activeTab: string
  onTabChange: (value: string) => void
  onFilterClick?: () => void
}

export function SearchSection({ onSearch, userLocation, onLocationClick, activeTab, onTabChange, onFilterClick }: SearchSectionProps) {
  const [searchValue, setSearchValue] = useState("")
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)

  // Banner images data
  const bannerImages = [
    {
      src: "/banner/Can you generate restaurant sbanner images for a burger promo_ Text FREE BURGER.jpg",
      alt: "Free Burger Promo"
    },
    {
      src: "/banner/Can you generate restaurant sbanner images for apizza promo_ Text 30 days of pizza 3d charater.jpg", 
      alt: "30 Days of Pizza Promo"
    },
    {
      src: "/banner/Can you generate restaurant sbanner images for a brand called delika_.jpg",
      alt: "Delika Brand Banner"
    },
    {
      src: "/banner/Can you generate restaurant sbanner images, randon food item with random messaging.jpg",
      alt: "Food Promo Banner"
    }
  ]

  // Auto-scroll banner every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => 
        (prevIndex + 1) % bannerImages.length
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [bannerImages.length])

  useEffect(() => {
    loadGoogleMaps().catch(console.error)

    // Log current location data when component mounts
    const locationData = localStorage.getItem('userLocationData')
    if (locationData) {
      const parsedData = JSON.parse(locationData)
      console.log('Current Location Data:', {
        address: parsedData.address,
        coordinates: {
          latitude: parsedData.lat,
          longitude: parsedData.lng
        }
      })
    }
  }, [])

  // Log when location changes
  useEffect(() => {
    if (userLocation) {
      const locationData = localStorage.getItem('userLocationData')
      if (locationData) {
        const parsedData = JSON.parse(locationData)
        console.log('Location Updated:', {
          address: userLocation,
          coordinates: {
            latitude: parsedData.lat,
            longitude: parsedData.lng
          }
        })
      }
    }
  }, [userLocation])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    onSearch(value)
    
    // Emit search events for grocery and pharmacy components
    window.dispatchEvent(new CustomEvent('grocerySearchUpdate', { 
      detail: { query: value } 
    }));
    window.dispatchEvent(new CustomEvent('pharmacySearchUpdate', { 
      detail: { query: value } 
    }));
  }

  const handleLocationClick = () => {
    console.log('Location button clicked')
    const locationData = localStorage.getItem('userLocationData')
    if (locationData) {
      console.log('Current Location Data before change:', JSON.parse(locationData))
    }
    onLocationClick()
  }

  return (
    <div className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="py-4">
          {/* Mobile Layout */}
          <div className="md:hidden">
            {/* Search and Location Row */}
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={handleLocationClick}
                className="flex items-center justify-center p-3 rounded-full border border-gray-200 bg-white flex-shrink-0"
                aria-label="Select delivery location"
              >
                <MapPin className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search restaurants"
                  value={searchValue}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {/* Filter button */}
                {onFilterClick && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full flex items-center gap-2 flex-shrink-0"
                    onClick={onFilterClick}
                    aria-label="Open filter options"
                  >
                    <Settings2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Tabs Row */}
            <div className="w-full flex justify-center mb-4">
              <Tabs value={activeTab} onValueChange={onTabChange}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
                  <TabsTrigger value="groceries">Groceries</TabsTrigger>
                  <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* Mobile Auto-Scrolling Banner */}
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
              >
                {bannerImages.map((banner, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-2">
                    <div className="relative w-full h-40 rounded-lg overflow-hidden shadow-sm">
                      <Image
                        src={banner.src}
                        alt={banner.alt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 0px"
                        priority={index === 0}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Banner Indicators */}
              <div className="flex justify-center mt-3 gap-2">
                {bannerImages.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                      index === currentBannerIndex ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                    onClick={() => setCurrentBannerIndex(index)}
                    aria-label={`Go to banner ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex md:items-center md:justify-between w-full">
            {/* Location */}
            <button
              type="button"
              onClick={handleLocationClick}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 whitespace-nowrap flex-shrink-0"
            >
              <MapPin className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{userLocation}</span>
            </button>
            
            {/* Search */}
            <div className="flex-1 relative mx-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search restaurants"
                value={searchValue}
                onChange={handleChange}
                className="w-full pl-10 pr-12 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {/* Filter button */}
              {onFilterClick && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full flex items-center gap-2 flex-shrink-0"
                  onClick={onFilterClick}
                  aria-label="Open filter options"
                >
                  <Settings2 className="w-5 h-5" />
                </button>
              )}
            </div>
            
            {/* Tabs */}
            <div className="flex-shrink-0">
              <Tabs value={activeTab} onValueChange={onTabChange}>
                <TabsList>
                  <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
                  <TabsTrigger value="groceries">Groceries</TabsTrigger>
                  <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 