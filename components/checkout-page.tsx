"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShoppingBag, Check, Plus, Minus, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { CartItem } from "@/types/cart"

interface CheckoutPageProps {
  cart: CartItem[]
  cartTotal: number
  onSubmitOrder: (customerInfo: CustomerInfo) => void
  onAddItem: (item: CartItem) => void
  onRemoveItem: (itemId: string) => void
  menuCategories: Array<{
    foodType: string
    foods: CartItem[]
  }>
  branchId: string
  branchName: string
  restaurantName: string
  branchCity: string
  onBackToCart: () => void
}

interface CustomerInfo {
  name: string
  phone: string
  address: string
  notes: string
}

interface BranchDetails {
  _menutable?: Array<{
    foodType: string
    foods: Array<{
      name: string
      price: string
      available: boolean
      description?: string
      foodImage?: { url: string }
    }>
    foodTypeImage?: { url: string }
  }>
}

export function CheckoutPage({
  cart,
  cartTotal,
  onSubmitOrder,
  onAddItem,
  onRemoveItem,
  menuCategories,
  branchId,
  branchName,
  restaurantName,
  branchCity,
  onBackToCart
}: CheckoutPageProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    phone: "",
    address: "",
    notes: ""
  })
  const [formErrors, setFormErrors] = useState<Partial<CustomerInfo>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>(
    menuCategories?.[0]?.foodType || ""
  )
  const [branchDetails, setBranchDetails] = useState<BranchDetails | null>(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Loading customer info and location...');
    
    // Try to get the saved location first
    const savedLocation = localStorage.getItem('userLocation');
    console.log('Raw saved location:', savedLocation);
    
    if (savedLocation) {
      try {
        const locationData = JSON.parse(savedLocation);
        console.log('Parsed location data:', locationData);
        
        if (locationData.address) {
          console.log('Setting address:', locationData.address);
          setCustomerInfo(prev => {
            const updated = {
              ...prev,
              address: locationData.address
            };
            console.log('Updated customer info:', updated);
            return updated;
          });
        }
      } catch (e) {
        console.error('Error parsing saved location:', e);
      }
    }
    
    // Then try to load saved customer info
    const savedInfo = localStorage.getItem('customerInfo');
    console.log('Saved customer info:', savedInfo);
    
    if (savedInfo) {
      try {
        const parsedInfo = JSON.parse(savedInfo);
        setCustomerInfo(prev => ({
          ...prev,
          ...parsedInfo
        }));
      } catch (e) {
        console.error('Error parsing saved customer info:', e);
      }
    }

    // Load the saved location from localStorage when component mounts
    const savedLocationData = localStorage.getItem('userLocationData')
    if (savedLocationData) {
      const { address } = JSON.parse(savedLocationData)
      setCustomerInfo(prev => ({
        ...prev,
        address: address
      }))
    }
  }, []);

  useEffect(() => {
    async function fetchBranchDetails() {
      try {
        setIsLoadingMenu(true);
        setMenuError(null);
        
        const response = await fetch(
          `https://api-server.krontiva.africa/api:uEBBwbSs/get/branch/details?branchId=${branchId}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            }
          }
        );
        
        const data = await response.json();
        
        if (!data || !data._menutable) {
          setMenuError("Failed to load menu items");
          return;
        }

        setBranchDetails(data);
        // Update selected category if not already set
        if (!selectedCategory && data._menutable?.[0]) {
          setSelectedCategory(data._menutable[0].foodType);
        }
      } catch (error) {
        console.error('Error fetching branch details:', error);
        setMenuError("Failed to load menu items");
      } finally {
        setIsLoadingMenu(false);
      }
    }

    fetchBranchDetails();
  }, [branchId]);

  const validatePhoneNumber = (value: string) => {
    return /^\d+$/.test(value); // Only allows digits
  }

  const validateName = (value: string) => {
    return /^[A-Za-z\s]+$/.test(value); // Only allows letters and spaces
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // Validation for phone numbers - only allow digits
    if (name === 'phone') {
      if (!validatePhoneNumber(value) && value !== '') {
        return; // Don't update if input contains non-digits
      }
    }
    
    // Validation for name - only allow letters and spaces
    if (name === 'name') {
      if (!validateName(value) && value !== '') {
        return; // Don't update if input contains numbers or special characters
      }
    }

    const updatedInfo = { ...customerInfo, [name]: value }
    setCustomerInfo(updatedInfo)
    localStorage.setItem('customerInfo', JSON.stringify(updatedInfo))
  }

  const validateForm = () => {
    const errors: Partial<CustomerInfo> = {}
    
    if (!customerInfo.name.trim()) {
      errors.name = "Full name is required"
    }
    
    if (!customerInfo.phone.trim()) {
      errors.phone = "Phone number is required"
    }
    
    if (!customerInfo.address.trim()) {
      errors.address = "Delivery address is required"
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorField = document.querySelector('[aria-invalid="true"]')
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    
    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      onSubmitOrder(customerInfo)
      setIsSubmitting(false)
      setIsSuccess(true)
      
      // Reset form after success
      setTimeout(() => {
        setIsSuccess(false)
      }, 3000)
    }, 1500)
  }

  const currentCategory = branchDetails?._menutable?.find(
    cat => cat.foodType === selectedCategory
  );

  if (isSuccess) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-6 my-8">
        <div className="py-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-medium text-gray-900 mb-3">Order Placed Successfully!</h3>
          <p className="text-gray-500 mb-6">Your order receipt has been sent to your phone.</p>
          <Link href={`/branch/${branchId}`}>
            <Button className="bg-orange-500 hover:bg-orange-600">
              Return to Restaurant
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center mb-6">
        <button 
          onClick={onBackToCart}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cart
        </button>
        <h1 className="text-2xl font-bold text-center flex-1 pr-8">Checkout</h1>
      </div>
      
      {/* 1. Order Summary - First */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        <div className="mb-4">
          <h3 className="font-medium text-gray-700 mb-1">From: {restaurantName || 'Restaurant'}</h3>
          <p className="text-sm text-gray-500">
            {branchName} {branchCity ? `• ${branchCity}` : ''}
          </p>
        </div>
        
        {cart.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            Your cart is empty
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.quantity}×</span>
                  <span>{item.name}</span>
                </div>
                <span>GH₵ {(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
        
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">GH₵ {cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Delivery Fee</span>
            <span className="font-medium">GH₵ 10.00</span>
          </div>
          <div className="flex justify-between text-base font-semibold pt-2 border-t mt-2">
            <span>Total</span>
            <span>GH₵ {(cartTotal + 10).toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      {/* 2. Add More Items Section - Second */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add More Items</h2>
        
        {isLoadingMenu ? (
          <div className="text-center py-4">Loading menu items...</div>
        ) : menuError ? (
          <div className="text-center py-4 text-red-500">{menuError}</div>
        ) : (
          <>
            {/* Category Selection */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
              {branchDetails?._menutable?.map(category => (
                <button
                  key={category.foodType}
                  onClick={() => setSelectedCategory(category.foodType)}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                    selectedCategory === category.foodType
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.foodType}
                </button>
              ))}
            </div>
            
            {/* Menu Items */}
            <div className="space-y-4">
              {currentCategory?.foods.map(item => {
                const itemInCart = cart.find(cartItem => cartItem.id === item.name);
                const quantity = itemInCart?.quantity || 0;

                return (
                  <div
                    key={item.name}
                    className={`flex items-center gap-4 p-3 rounded-lg ${
                      !item.available ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="relative w-20 h-20 flex-shrink-0">
                      {item.foodImage?.url ? (
                        <Image
                          src={item.foodImage.url}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className={`rounded-md object-cover ${!item.available ? 'grayscale' : ''}`}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-medium text-gray-900">GH₵ {item.price}</span>
                        {item.available ? (
                          quantity > 0 ? (
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                className="bg-orange-500 hover:bg-orange-600 h-7 w-7 rounded-full text-white"
                                onClick={() => onRemoveItem(item.name)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-4 text-center">{quantity}</span>
                              <Button
                                size="icon"
                                className="bg-orange-500 hover:bg-orange-600 h-7 w-7 rounded-full text-white"
                                onClick={() => onAddItem({
                                  id: item.name,
                                  name: item.name,
                                  price: item.price,
                                  quantity: 1,
                                  image: item.foodImage?.url,
                                  available: item.available
                                })}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="icon"
                              className="bg-orange-500 hover:bg-orange-600 h-7 w-7 rounded-full text-white"
                              onClick={() => onAddItem({
                                id: item.name,
                                name: item.name,
                                price: item.price,
                                quantity: 1,
                                image: item.foodImage?.url,
                                available: item.available
                              })}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          )
                        ) : (
                          <span className="text-sm text-gray-500">Not Available</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
      
      {/* 3. Customer Information Form - Third */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                name="name"
                value={customerInfo.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                pattern="[A-Za-z\s]+"
                title="Please enter only letters and spaces"
                aria-invalid={!!formErrors.name}
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Only letters and spaces are allowed</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <Input
                name="phone"
                value={customerInfo.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                required
                type="tel"
                pattern="[0-9]*"
                inputMode="numeric"
                title="Please enter only numbers"
                aria-invalid={!!formErrors.phone}
                className={formErrors.phone ? "border-red-500" : ""}
              />
              {formErrors.phone && (
                <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Only numbers are allowed</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Delivery Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  name="address"
                  value={customerInfo.address}
                  readOnly
                  placeholder="Your delivery address will be shown here"
                  required
                  aria-invalid={!!formErrors.address}
                  className={`${formErrors.address ? "border-red-500" : ""} bg-gray-50 cursor-not-allowed`}
                />
              </div>
              {formErrors.address && (
                <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                To change delivery address, please select a different location from the main page
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Additional Notes (Optional)</label>
              <textarea
                name="notes"
                value={customerInfo.notes}
                onChange={handleChange}
                placeholder="Any special instructions for delivery"
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm min-h-[80px]"
              />
            </div>
          </div>
        </form>
      </div>
      
      {/* 4. Submit Order Button - Last */}
      <Button 
        onClick={handleSubmit}
        className="w-full bg-orange-500 hover:bg-orange-600 h-12 mb-8"
        disabled={isSubmitting || cart.length === 0}
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            Processing...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Send Order Receipt
          </span>
        )}
      </Button>
    </div>
  )
} 