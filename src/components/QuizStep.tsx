import { useForm } from 'react-hook-form';
import { QuizAnswers } from '../types/quiz';
import { googlePlacesService } from '../utils/googlePlaces';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';

interface QuizStepProps {
  currentStep: number;
  answers: Partial<QuizAnswers>;
  onNext: (data: Partial<QuizAnswers>) => void;
  onPrev: () => void;
}

const services = ['Polyurea', 'Polyaspartic', 'Decorative Concrete', 'Epoxy'];

export default function QuizStep({ currentStep, answers, onNext, onPrev }: QuizStepProps) {
  const [businessSearch, setBusinessSearch] = useState(answers.businessName || '');
  const [citySearch, setCitySearch] = useState(answers.city || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
  const [businessData, setBusinessData] = useState<any>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showCityField, setShowCityField] = useState(!!answers.businessName); // Show city field if business already entered


  const { register, handleSubmit, formState: { errors }, setValue, watch, setError, clearErrors } = useForm({
    defaultValues: {
      ...answers,
      services: answers.services || []
    }
  });

  // Watch form values for validation  
  const watchedRadius = watch('radius');
  const watchedResponseTime = watch('responseTime');
  const watchedSmsCapability = watch('smsCapability');
  const watchedPremiumPages = watch('premiumPages');
  const watchedReviewCount = watch('reviewCount');

  // Custom validation function for each step
  const validateStep = (data: any) => {
    const newErrors: any = {};

    // Step 2 (services) is NOT required - users can skip it - NO VALIDATION

    if (currentStep === 3) {
      // Radius required - check both data and watched values
      const radius = data.radius || watchedRadius;
      if (!radius) {
        newErrors.radius = { message: 'Please select your service radius' };
      }
    }

    if (currentStep === 4) {
      // Response time required - check both data and watched values
      const responseTime = data.responseTime || watchedResponseTime;
      if (!responseTime) {
        newErrors.responseTime = { message: 'Please select your response time' };
      }
    }

    if (currentStep === 5) {
      // SMS capability required - check both data and watched values
      const smsCapability = data.smsCapability || watchedSmsCapability;
      if (!smsCapability) {
        newErrors.smsCapability = { message: 'Please select your SMS capability' };
      }
    }

    if (currentStep === 6) {
      // Premium pages required - check both data and watched values
      const premiumPages = data.premiumPages || watchedPremiumPages;
      if (!premiumPages) {
        newErrors.premiumPages = { message: 'Please select your service page status' };
      }
    }

    if (currentStep === 7) {
      // Review count required - check both data and watched values
      const reviewCount = data.reviewCount !== undefined ? data.reviewCount : watchedReviewCount;
      if (reviewCount === undefined || reviewCount === null) {
        newErrors.reviewCount = { message: 'Please select your review count' };
      }
    }

    return Object.keys(newErrors).length === 0 ? null : newErrors;
  };

  // Custom form submission handler with validation
  const handleFormSubmit = (data: any) => {
    // Clear any previous errors
    clearErrors();
    
    // Custom validation for steps that need it
    const validationErrors = validateStep(data);
    
    if (validationErrors) {
      // Set custom errors using React Hook Form's setError
      Object.keys(validationErrors).forEach(field => {
        setError(field as any, {
          type: 'required',
          message: validationErrors[field].message
        });
      });
      return; // Don't proceed if validation fails
    }
    
    // If validation passes, proceed with the normal flow
    onNext(data);
  };

  useEffect(() => {
    // Initialize Google Places API
    googlePlacesService.initialize();
  }, []);

  const handleBusinessSearch = async (value: string) => {
    setBusinessSearch(value);
    setValue('businessName', value);
    
    // Show city field when user starts typing
    if (value.length > 0 && !showCityField) {
      setShowCityField(true);
    }
    
    if (value.length > 2) {
      setIsLoadingSuggestions(true);
      try {
        // Now using real Google Places API
        const result = await googlePlacesService.searchBusinesses(value);
        const newSuggestions = result.suggestions || [];
        setSuggestions(newSuggestions);
        setActiveSuggestionIndex(newSuggestions.length > 0 ? 0 : -1);
        
        // Handle business data if available
        if ('businessData' in result && result.businessData) {
          setBusinessData(result.businessData);
          // Store business intelligence data (hidden from user)
          setValue('businessData', result.businessData);
          if (result.businessData.city) {
            setCitySearch(result.businessData.city + ', ' + result.businessData.state);
            setValue('city', result.businessData.city + ', ' + result.businessData.state);
          }
        }
      } catch (error) {
        console.error('Error searching businesses:', error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setActiveSuggestionIndex(-1);
      setIsLoadingSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setBusinessSearch(suggestion);
    setValue('businessName', suggestion);
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
    
    // Extract city from suggestion - handle different formats
    let cityPart = '';
    
    // Format: "Business Name - City, State" or "Business Name, City, State"
    if (suggestion.includes(' - ') && suggestion.includes(', ')) {
      // Format: "Premium Coatings Milwaukee - Milwaukee, WI"
      const afterDash = suggestion.split(' - ')[1];
      if (afterDash) {
        cityPart = afterDash.trim();
      }
    } else if (suggestion.includes(', ')) {
      // Format: "M&P Concrete Coatings, North Baehr Road, Mequon, WI, USA"
      const parts = suggestion.split(', ');
      if (parts.length >= 3) {
        // Look for city by finding the part before state abbreviation
        for (let i = parts.length - 1; i >= 0; i--) {
          const part = parts[i].trim();
          // Check if this looks like a US state (2 uppercase letters)
          if (part.match(/^[A-Z]{2}$/) && part !== 'USA') {
            // The part before this should be the city
            if (i > 0) {
              const possibleCity = parts[i - 1].trim();
              // Make sure it's not a street address component
              if (!possibleCity.match(/\d+/) && !possibleCity.toLowerCase().includes('road') && 
                  !possibleCity.toLowerCase().includes('street') && !possibleCity.toLowerCase().includes('avenue')) {
                cityPart = `${possibleCity}, ${part}`;
                break;
              }
            }
          }
        }
        // Fallback to last two parts if no pattern matched
        if (!cityPart && parts.length >= 2) {
          cityPart = parts.slice(-2).join(', ');
        }
      } else if (parts.length === 2) {
        // Simple "City, State" format
        cityPart = suggestion.split(', ').slice(-2).join(', ');
      }
    }
    
    if (cityPart) {
      setCitySearch(cityPart);
      setValue('city', cityPart);
    }
  };

  const onBusinessKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        e.preventDefault();
        selectSuggestion(suggestions[activeSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setActiveSuggestionIndex(-1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Let's start with your business info
              </h2>
              <p className="text-muted-foreground mb-8">This helps us personalize your assessment</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Your Full Name</Label>
                <Input
                  {...register('fullName', { required: 'Full name is required' })}
                  id="fullName"
                  placeholder="e.g. John Smith"
                  className="h-12"
                />
                {errors.fullName && (
                  <p className="text-destructive text-sm">{errors.fullName.message}</p>
                )}
              </div>
              
              <div className="relative space-y-2">
                <Label htmlFor="businessName">Business Name & Location</Label>
                <Input
                  id="businessName"
                  value={businessSearch}
                  onChange={(e) => handleBusinessSearch(e.target.value)}
                  onBlur={() => setTimeout(() => setSuggestions([]), 200)}
                  onKeyDown={onBusinessKeyDown}
                  placeholder="e.g. Premium Coatings Milwaukee or just your business name..."
                  className="h-12"
                  aria-autocomplete="list"
                  aria-controls="business-suggestions"
                  aria-expanded={suggestions.length > 0}
                  aria-activedescendant={activeSuggestionIndex >= 0 ? `business-option-${activeSuggestionIndex}` : undefined}
                />
                
                {isLoadingSuggestions && (
                  <div className="absolute right-3 top-10 text-muted-foreground">
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                  </div>
                )}
                
                {suggestions.length > 0 && (
                  <Card className="absolute z-10 w-full mt-1" role="listbox" aria-label="Business suggestions" id="business-suggestions" aria-live="polite">
                    <CardContent className="p-0">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectSuggestion(suggestion)}
                          className="w-full text-left px-4 py-3 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground first:rounded-t-md last:rounded-b-md border-b border-border last:border-b-0"
                          role="option"
                          id={`business-option-${index}`}
                          aria-selected={activeSuggestionIndex === index}
                          onMouseEnter={() => setActiveSuggestionIndex(index)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-blue-500">📍</span>
                            <span>{suggestion}</span>
                          </div>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                )}
                
                {errors.businessName && (
                  <p className="text-destructive text-sm">{errors.businessName.message}</p>
                )}
                
                {businessData?.hasGBP && (
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <span>✓</span>
                    <span>Google Business Profile found</span>
                    {businessData.rating && (
                      <span>• ⭐ {businessData.rating} ({businessData.reviewCount} reviews)</span>
                    )}
                  </div>
                )}
              </div>
              
              {showCityField && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="city">Primary Service City</Label>
                  <Input
                    {...register('city')}
                    id="city"
                    value={citySearch}
                    onChange={(e) => {
                      setCitySearch(e.target.value);
                      setValue('city', e.target.value);
                    }}
                    placeholder={citySearch ? "Edit if needed..." : "Auto-filled from business search above..."}
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    {citySearch ? "You can modify this location if needed" : "This will auto-populate when you select a business"}
                  </p>
                  
                  {errors.city && (
                    <p className="text-destructive text-sm">{errors.city.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                What are your priority services?
              </h2>
              <p className="text-muted-foreground mb-8">Select all that apply - we'll focus on these for lead generation</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <Card key={service} className="cursor-pointer transition-colors hover:bg-accent select-none">
                  <CardContent className="flex items-center space-x-3 p-4">
                    <Checkbox
                      {...register('services')}
                      value={service}
                      id={`service-${service}`}
                    />
                    <Label 
                      htmlFor={`service-${service}`}
                      className="text-base font-medium cursor-pointer flex-1 select-none"
                    >
                      {service}
                    </Label>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {errors.services && (
              <p className="text-destructive text-sm">{errors.services.message}</p>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                How far do you travel for $8k+ jobs?
              </h2>
              <p className="text-muted-foreground mb-8">This helps us understand your service area potential</p>
            </div>
            
            <RadioGroup
              onValueChange={(value) => setValue('radius', parseInt(value))}
              value={watchedRadius?.toString() || ''}
              className="space-y-3"
            >
              {[
                { value: '20', label: '15-20 miles from base' },
                { value: '30', label: 'About 30 miles' },
                { value: '45', label: '45+ miles (regional coverage)' }
              ].map((option) => (
                <Card 
                  key={option.value} 
                  className="cursor-pointer transition-colors hover:bg-accent select-none"
                  onClick={() => setValue('radius', parseInt(option.value))}
                >
                  <CardContent className="flex items-center space-x-3 p-4">
                    <RadioGroupItem value={option.value} id={`radius-${option.value}`} />
                    <Label 
                      htmlFor={`radius-${option.value}`}
                      className="text-base cursor-pointer flex-1 select-none"
                    >
                      {option.label}
                    </Label>
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
            
            {errors.radius && (
              <p className="text-destructive text-sm">{errors.radius.message}</p>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                How fast do you typically respond to new leads?
              </h2>
              <p className="text-muted-foreground mb-8">Speed-to-lead is the #1 factor in conversion rates</p>
            </div>
            
            <RadioGroup
              onValueChange={(value) => setValue('responseTime', parseInt(value))}
              value={watchedResponseTime?.toString() || ''}
              className="space-y-3"
            >
              {[
                { value: '15', label: '15 minutes or less', badge: 'Best', badgeVariant: 'success' },
                { value: '60', label: 'Within 1 hour', badge: 'Good', badgeVariant: 'default' },
                { value: '1440', label: 'Same day', badge: 'OK', badgeVariant: 'secondary' },
                { value: '2880', label: 'It varies', badge: null, badgeVariant: null }
              ].map((option) => (
                <Card 
                  key={option.value} 
                  className="cursor-pointer transition-colors hover:bg-accent select-none"
                  onClick={() => setValue('responseTime', parseInt(option.value))}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={option.value} id={`response-${option.value}`} />
                      <Label 
                        htmlFor={`response-${option.value}`}
                        className="text-base cursor-pointer select-none"
                      >
                        {option.label}
                      </Label>
                    </div>
                    {option.badge && (
                      <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
                        option.badgeVariant === 'success' ? 'bg-green-100 text-green-800' :
                        option.badgeVariant === 'default' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {option.badge}
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
            
            {errors.responseTime && (
              <p className="text-destructive text-sm">{errors.responseTime.message}</p>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Do you have SMS capabilities set up?
              </h2>
              <p className="text-muted-foreground mb-8">Text messaging can increase response rates by 40%</p>
            </div>
            
            <RadioGroup
              onValueChange={(value) => setValue('smsCapability', value as any)}
              value={watchedSmsCapability || ''}
              className="space-y-3"
            >
              {[
                { value: 'both', label: 'Yes - both text-back AND autoresponder' },
                { value: 'text-back', label: 'Just missed-call text-back' },
                { value: 'autoresponder', label: 'Just SMS autoresponder' },
                { value: 'neither', label: 'No SMS setup yet' }
              ].map((option) => (
                <Card 
                  key={option.value} 
                  className="cursor-pointer transition-colors hover:bg-accent select-none"
                  onClick={() => setValue('smsCapability', option.value as any)}
                >
                  <CardContent className="flex items-center space-x-3 p-4">
                    <RadioGroupItem value={option.value} id={`sms-${option.value}`} />
                    <Label 
                      htmlFor={`sms-${option.value}`}
                      className="text-base cursor-pointer flex-1 select-none"
                    >
                      {option.label}
                    </Label>
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
            
            {errors.smsCapability && (
              <p className="text-destructive text-sm">{errors.smsCapability.message}</p>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Do you have dedicated pages for each service?
              </h2>
              <p className="text-muted-foreground mb-8">Service-specific pages convert 3x better than generic pages</p>
            </div>
            
            <RadioGroup
              onValueChange={(value) => setValue('premiumPages', value as any)}
              value={watchedPremiumPages || ''}
              className="space-y-3"
            >
              {[
                { value: 'all', label: 'Yes - all services have their own pages' },
                { value: 'some', label: 'Some services have pages' },
                { value: 'none', label: 'No - just general service info' }
              ].map((option) => (
                <Card 
                  key={option.value} 
                  className="cursor-pointer transition-colors hover:bg-accent select-none"
                  onClick={() => setValue('premiumPages', option.value as any)}
                >
                  <CardContent className="flex items-center space-x-3 p-4">
                    <RadioGroupItem value={option.value} id={`pages-${option.value}`} />
                    <Label 
                      htmlFor={`pages-${option.value}`}
                      className="text-base cursor-pointer flex-1 select-none"
                    >
                      {option.label}
                    </Label>
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
            
            {errors.premiumPages && (
              <p className="text-destructive text-sm">{errors.premiumPages.message}</p>
            )}
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                How many Google reviews have you gotten in the last 60 days?
              </h2>
              <p className="text-muted-foreground mb-8">Recent review velocity shows active customer satisfaction</p>
            </div>
            
            <RadioGroup
              onValueChange={(value) => setValue('reviewCount', parseInt(value))}
              value={watchedReviewCount?.toString() || ''}
              className="space-y-3"
            >
              {[
                { value: '0', label: '0-3 reviews' },
                { value: '5', label: '4-7 reviews' },
                { value: '10', label: '8+ reviews' },
                { value: '-1', label: 'Not sure' }
              ].map((option) => (
                <Card 
                  key={option.value} 
                  className="cursor-pointer transition-colors hover:bg-accent select-none"
                  onClick={() => setValue('reviewCount', parseInt(option.value))}
                >
                  <CardContent className="flex items-center space-x-3 p-4">
                    <RadioGroupItem value={option.value} id={`review-${option.value}`} />
                    <Label 
                      htmlFor={`review-${option.value}`}
                      className="text-base cursor-pointer flex-1 select-none"
                    >
                      {option.label}
                    </Label>
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
            
            {errors.reviewCount && (
              <p className="text-destructive text-sm">{errors.reviewCount.message}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        {renderStepContent()}
        
        <div className="flex justify-between pt-8">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={onPrev}
              size="lg"
            >
              Previous
            </Button>
          )}
          
          <Button
            type="submit"
            size="lg"
            className="ml-auto"
          >
            {currentStep === 7 ? 'Get My Score' : 'Next'}
          </Button>
        </div>
      </form>
    </div>
  );
}
