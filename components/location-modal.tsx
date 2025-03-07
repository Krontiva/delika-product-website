"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete"

interface LocationModalProps {
  isOpen: boolean
  onClose: () => void
  onLocationSelect: (location: google.maps.places.PlaceResult) => void
}

export function LocationModal({ isOpen, onClose, onLocationSelect }: LocationModalProps) {
  const handleSelect = (location: google.maps.places.PlaceResult) => {
    console.log('Location selected in modal:', location)
    onLocationSelect(location)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="location-modal-description">
        <DialogHeader>
          <DialogTitle>Set Delivery Location</DialogTitle>
          <DialogDescription id="location-modal-description">
            Enter your delivery address to find restaurants that deliver to your location. This helps us show you available restaurants and calculate delivery fees accurately.
          </DialogDescription>
        </DialogHeader>
        <GooglePlacesAutocomplete onPlaceSelect={handleSelect} />
      </DialogContent>
    </Dialog>
  )
} 