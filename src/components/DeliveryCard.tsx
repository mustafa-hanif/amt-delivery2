import { Phone, MessageCircle, MapPin, Navigation, Globe, Clock } from 'lucide-react';
import type { DeliveryWithDistance, Delivery } from "../types";

interface DeliveryCardProps {
  delivery: DeliveryWithDistance;
  onStatusUpdate?: (deliveryId: string, status: Delivery['status']) => void;
}

export function DeliveryCard({ delivery, onStatusUpdate }: DeliveryCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-500';
      case 'On Way': return 'bg-blue-500';
      case 'Delivered': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: Delivery['status']) => {
    return status; // Status values are already properly formatted
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const handleCall = () => {
    window.open(`tel:${delivery.customerPhone}`, '_self');
  };

  const handleWhatsApp = () => {
    const message = `Hello ${delivery.customerName}, your delivery is on the way!`;
    const whatsappUrl = `https://wa.me/${delivery.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const locationParts = [delivery.customerCity, delivery.customerCountry].filter(Boolean);
  const locationLabel = locationParts.join(', ');

  const mapsDestination = (() => {
    if (delivery.latitude && delivery.longitude) {
      return `${delivery.latitude},${delivery.longitude}`;
    }

    if (delivery.customerAddress) {
      return encodeURIComponent(delivery.customerAddress);
    }

    if (locationLabel) {
      return encodeURIComponent(locationLabel);
    }

    return '';
  })();

  const handleDirections = () => {
    if (!mapsDestination) {
      alert("No destination available for this delivery yet.");
      return;
    }

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapsDestination}`;
    window.open(googleMapsUrl, '_blank');
  };

  const handleStatusChange = (newStatus: Delivery['status']) => {
    if (onStatusUpdate) {
      onStatusUpdate(delivery._id, newStatus);
    }
  };

  return (
    <div className={`delivery-card border-2 rounded-lg p-4 mb-4 ${getPriorityColor(delivery.priority)}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800">{delivery.customerName}</h3>
          {delivery.customerAddress && (
            <p className="text-sm text-gray-600 mb-1">{delivery.customerAddress}</p>
          )}
          {locationLabel && (
            <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
              <Globe size={14} /> {locationLabel}
            </p>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {delivery.distanceText} away
            </span>
            {delivery.estimatedDeliveryTime && (
              <span className="flex items-center gap-1">
                <Clock size={14} /> {delivery.estimatedDeliveryTime}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-2 py-1 rounded-full text-white text-xs font-medium ${getStatusColor(delivery.status)}`}>
            {getStatusLabel(delivery.status)}
          </span>
          <span className="text-xs text-gray-500 capitalize">{delivery.priority} priority</span>
        </div>
      </div>

      {delivery.notes && (
        <p className="text-sm text-gray-700 mb-3 italic">"{delivery.notes}"</p>
      )}

      {delivery.orderValue && (
        <p className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-1">
          Order Value: AED {delivery.orderValue.toFixed(2)}
        </p>
      )}

      <div className="flex gap-2 mb-3">
        <button
          onClick={handleCall}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Phone size={18} /> Call
        </button>
        <button
          onClick={handleWhatsApp}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <MessageCircle size={18} /> WhatsApp
        </button>
      </div>

      <button
        onClick={handleDirections}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mb-3"
      >
        <Navigation size={18} /> Get Directions
      </button>

      {delivery.status !== 'Delivered' && (
        <div className="flex gap-2">
          {delivery.status === 'Pending' && (
            <button
              onClick={() => handleStatusChange('On Way')}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Start Delivery
            </button>
          )}
          {delivery.status === 'On Way' && (
            <button
              onClick={() => handleStatusChange('Delivered')}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Mark Delivered
            </button>
          )}
        </div>
      )}
    </div>
  );
}