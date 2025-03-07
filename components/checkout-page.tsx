"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShoppingBag, Check, Plus, Minus, ArrowLeft, MapPin, Phone, User, FileText, ArrowRight } from "lucide-react"
import Image from "next/image"
import { CartItem } from "@/types/cart"
import { calculateDistance, calculateDeliveryFee } from "@/lib/distance"
import { OrderFeedback } from "@/components/order-feedback"

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
  branchLocation?: { latitude: number; longitude: number }
  branchPhone: string
}

interface CustomerInfo {
  name: string
  phone: string
  address: string
  notes: string
  rating?: number
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
  onBackToCart,
  branchLocation,
  branchPhone
}: CheckoutPageProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    phone: "",
    address: "",
    notes: "",
    rating: 0
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
  const [deliveryFee, setDeliveryFee] = useState(10) // Default fee
  const [distance, setDistance] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)

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
        // Only set selected category if it's not already set
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
  }, [branchId, selectedCategory]);

  useEffect(() => {
    const calculateFee = async () => {
      try {
        // Get user's location from localStorage
        const locationData = localStorage.getItem('userLocationData')
        if (!locationData || !branchLocation) {
          setDeliveryFee(15) // Default to minimum fee if no location data
          return
        }

        const { lat, lng } = JSON.parse(locationData)
        
        // Calculate distance between user and branch
        const distance = await calculateDistance(
          { latitude: lat, longitude: lng },
          { latitude: branchLocation.latitude, longitude: branchLocation.longitude }
        )
        
        setDistance(distance)
        const fee = calculateDeliveryFee(distance)
        setDeliveryFee(fee)
        
        console.log('Distance:', distance, 'km')
        console.log('Calculated fee:', fee, 'GH₵')
      } catch (error) {
        console.error('Error calculating delivery fee:', error)
        setDeliveryFee(15) // Default to minimum fee on error
      }
    }

    calculateFee()
  }, [branchLocation])

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
    }, 1500)
  }

  const currentCategory = branchDetails?._menutable?.find(
    cat => cat.foodType === selectedCategory
  );

  const formatOrderForWhatsApp = () => {
    const items = cart.map(item => 
      `• ${item.name} x${item.quantity} - GH₵${(parseFloat(item.price) * item.quantity).toFixed(2)}`
    ).join('\n')

    return `🛍️ *New Order from ${customerInfo.name}*
📍 Delivery to: ${customerInfo.address}
📱 Phone: ${customerInfo.phone}
${customerInfo.notes ? `📝 Notes: ${customerInfo.notes}\n` : ''}
*Order Details:*
${items}

*Summary:*
Subtotal: GH₵${cartTotal.toFixed(2)}
Delivery Fee: GH₵${deliveryFee.toFixed(2)}
*Total: GH₵${(cartTotal + deliveryFee).toFixed(2)}*`
  }

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(formatOrderForWhatsApp())
    const whatsappUrl = `https://wa.me/233${branchPhone}?text=${message}`
    window.open(whatsappUrl, '_blank')
    setShowFeedback(true)
  }

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            {!showFeedback ? (
              <>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Order Created Successfully!</h3>
                <p className="text-gray-600 mb-8">Complete your order by confirming on WhatsApp</p>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-left">
                    <h4 className="font-medium text-gray-900 mb-2">Next Steps:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-gray-600">
                      <li>Click the WhatsApp button below</li>
                      <li>Review your order details</li>
                      <li>Confirm your order on WhatsApp</li>
                      <li>Wait for delivery updates</li>
                    </ol>
                  </div>
                  
                  <Button 
                    onClick={handleWhatsAppClick}
                    className="w-full bg-[#25D366] hover:bg-[#1ea952] h-12 gap-2 text-base"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 1.856.001 3.598.723 4.907 2.034 1.31 1.311 2.031 3.054 2.03 4.908-.001 3.825-3.113 6.938-6.937 6.938z"/>
                    </svg>
                    Continue on WhatsApp
                  </Button>
                </div>
              </>
            ) : (
              <div className="border-t pt-8 mt-8">
                <OrderFeedback branchId={branchId} customerPhone={customerInfo.phone} />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Simplified Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm backdrop-blur-lg bg-white/80">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <button 
              onClick={onBackToCart}
              className="flex items-center text-gray-600 hover:text-orange-500 font-medium transition-colors group"
            >
              <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
              Back to Cart
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Complete Your Order</h1>
            <div className="w-24" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Summary */}
            <div className="bg-white rounded-3xl shadow-sm p-6 hover:shadow-md transition-all duration-300 border border-orange-100/50">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
                </div>
                <div className="text-right">
                  <h3 className="font-medium text-gray-900">{restaurantName || 'Restaurant'}</h3>
                  <p className="text-sm text-gray-500">
                    {branchName} {branchCity ? `• ${branchCity}` : ''}
                  </p>
                </div>
              </div>
              
              {cart.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                  <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {cart.map(item => (
                    <div key={item.id} className="py-4 flex items-center justify-between group">
                      <div className="flex items-start gap-4">
                        {item.image && (
                          <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 group-hover:shadow-md transition-shadow">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500 mt-1">Quantity: {item.quantity}</div>
                        </div>
                      </div>
                      <div className="font-medium text-gray-900">
                        GH₵ {(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 pt-6 border-t border-dashed space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">GH₵ {cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>Delivery Fee</span>
                    <div className="px-2 py-1 bg-green-100 rounded-full text-xs text-green-700">
                      {distance > 0 ? `${distance.toFixed(1)}km` : 'Standard'}
                    </div>
                  </div>
                  <span className="font-medium">GH₵ {deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-4 border-t">
                  <span>Total</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-gray-500">GH₵</span>
                    <span className="text-2xl text-orange-600">{(cartTotal + deliveryFee).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Add More Items Section */}
            <div className="bg-white rounded-3xl shadow-sm p-6 hover:shadow-md transition-all duration-300 border border-orange-100/50">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-xl font-semibold">Add More Items</h2>
                </div>
                {!isLoadingMenu && !menuError && (
                  <div className="flex gap-2 overflow-x-auto py-1 scrollbar-hide">
                    {branchDetails?._menutable?.map(category => (
                      <button
                        key={category.foodType}
                        onClick={() => setSelectedCategory(category.foodType)}
                        className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                          selectedCategory === category.foodType
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category.foodType}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {isLoadingMenu ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading menu items...</p>
                </div>
              ) : menuError ? (
                <div className="text-center py-12 text-red-500">{menuError}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentCategory?.foods.map(item => {
                    const itemInCart = cart.find(cartItem => cartItem.id === item.name);
                    const quantity = itemInCart?.quantity || 0;

                    return (
                      <div
                        key={item.name}
                        className={`flex gap-4 p-4 rounded-2xl border group transition-all duration-300 ${
                          !item.available 
                            ? 'opacity-60 bg-gray-50' 
                            : 'hover:border-orange-200 hover:shadow-sm hover:bg-orange-50/30'
                        }`}
                      >
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 group-hover:shadow-lg transition-shadow">
                          {item.foodImage?.url ? (
                            <Image
                              src={item.foodImage.url}
                              alt={item.name}
                              fill
                              sizes="96px"
                              className={`object-cover ${!item.available ? 'grayscale' : ''} transition-transform group-hover:scale-110`}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
                              <ShoppingBag className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                          <div className="flex items-center justify-between mt-3">
                            <span className="font-medium text-gray-900">GH₵ {item.price}</span>
                            {item.available ? (
                              quantity > 0 ? (
                                <div className="flex items-center gap-3 bg-orange-100/50 rounded-full p-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-full hover:bg-orange-200/50"
                                    onClick={() => onRemoveItem(item.name)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-6 text-center font-medium">{quantity}</span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-full hover:bg-orange-200/50"
                                    onClick={() => onAddItem({
                                      id: item.name,
                                      name: item.name,
                                      price: item.price,
                                      quantity: 1,
                                      image: item.foodImage?.url,
                                      available: item.available
                                    })}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  className="bg-orange-500 hover:bg-orange-600 shadow-sm hover:shadow-md transition-all"
                                  onClick={() => onAddItem({
                                    id: item.name,
                                    name: item.name,
                                    price: item.price,
                                    quantity: 1,
                                    image: item.foodImage?.url,
                                    available: item.available
                                  })}
                                >
                                  Add to Order
                                </Button>
                              )
                            ) : (
                              <span className="text-sm text-red-500 font-medium">Not Available</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Delivery Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm p-6 sticky top-36 border border-orange-100/50">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Delivery Details</h2>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      Full Name <span className="text-red-500">*</span>
                    </div>
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
                    className={`${
                      formErrors.name 
                        ? "border-red-300 focus:ring-red-500 bg-red-50" 
                        : "focus:ring-orange-500 focus:border-orange-500 hover:border-orange-300"
                    } h-12 rounded-xl transition-colors`}
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-red-500 mr-1" />
                      {formErrors.name}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      Phone Number <span className="text-red-500">*</span>
                    </div>
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
                    className={`${
                      formErrors.phone 
                        ? "border-red-300 focus:ring-red-500 bg-red-50" 
                        : "focus:ring-orange-500 focus:border-orange-500 hover:border-orange-300"
                    } h-12 rounded-xl transition-colors`}
                  />
                  {formErrors.phone && (
                    <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-red-500 mr-1" />
                      {formErrors.phone}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      Delivery Address <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <div className="relative">
                    <Input
                      name="address"
                      value={customerInfo.address}
                      readOnly
                      placeholder="Your delivery address will be shown here"
                      required
                      aria-invalid={!!formErrors.address}
                      className={`${
                        formErrors.address 
                          ? "border-red-300 bg-red-50" 
                          : "border-gray-200 bg-gray-50"
                      } h-12 rounded-xl cursor-not-allowed`}
                    />
                  </div>
                  {formErrors.address && (
                    <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-red-500 mr-1" />
                      {formErrors.address}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2 italic">
                    To change delivery address, please select a different location from the main page
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      Additional Notes
                    </div>
                  </label>
                  <textarea
                    name="notes"
                    value={customerInfo.notes}
                    onChange={handleChange}
                    placeholder="Any special instructions for delivery"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm min-h-[100px] resize-none focus:border-orange-500 focus:ring-orange-500 hover:border-orange-300 transition-colors"
                  />
                </div>

                <Button 
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 h-14 text-base font-medium transition-all relative overflow-hidden group rounded-xl shadow-orange-200/50 shadow-lg hover:shadow-xl"
                  disabled={isSubmitting || cart.length === 0}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                      Processing...
                    </span>
                  ) : (
                    <div className="relative w-full h-full">
                      <span className="absolute inset-0 flex items-center justify-center gap-2 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] transform group-hover:-translate-y-full">
                        <ShoppingBag className="h-5 w-5" />
                        Place Order • GH₵ {(cartTotal + deliveryFee).toFixed(2)}
                      </span>
                      <span className="absolute inset-0 flex items-center justify-center gap-2 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] transform translate-y-full group-hover:translate-y-0">
                        <span className="flex items-center gap-2">
                          Confirm Order
                          <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                      </span>
                    </div>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 