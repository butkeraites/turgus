# Requirements Document

## Introduction

Turgus is a mobile-first, bilingual (Portuguese/English) e-commerce platform that enables sellers to create and manage product listings through a photo-first workflow, while providing buyers with an Instagram-like feed experience to browse and purchase items. The system supports product lifecycle management from creation to sale completion.

## Glossary

- **Turgus_System**: The complete marketplace application including web interface and backend services
- **Seller_User**: A registered user who creates and manages product listings for sale
- **Buyer_User**: A registered user who browses and purchases products from sellers
- **Product_Item**: An individual item for sale with associated metadata (title, description, price, categories, and multiple photos)
- **Product_Feed**: The main browsing interface displaying product photos in a grid layout
- **Want_List**: A collection of products that a buyer has expressed interest in purchasing
- **Photo_Upload**: The process of uploading multiple product images before creating product listings
- **Product_Gallery**: A collection of multiple photos associated with a single Product_Item
- **Seller_Account**: A predefined account for managing product listings and sales
- **Buyer_Account**: A user-created account for browsing and purchasing products

## Requirements

### Requirement 1

**User Story:** As a seller, I want to upload multiple photos at once before creating products, so that I can efficiently organize my inventory creation process.

#### Acceptance Criteria

1. WHEN a Seller_User accesses the product creation workflow, THE Turgus_System SHALL provide a bulk photo upload interface
2. THE Turgus_System SHALL accept multiple image files simultaneously during Photo_Upload
3. WHEN Photo_Upload is complete, THE Turgus_System SHALL display all uploaded images in a selectable grid format
4. THE Turgus_System SHALL store uploaded photos temporarily until they are assigned to Product_Items
5. THE Turgus_System SHALL support common image formats (JPEG, PNG, WebP) with maximum file size of 300MB per image

### Requirement 2

**User Story:** As a seller, I want to select multiple photos for a single product, so that I can showcase different angles and details of my item.

#### Acceptance Criteria

1. WHEN a Seller_User views uploaded photos, THE Turgus_System SHALL enable multi-selection of images
2. WHEN photos are selected, THE Turgus_System SHALL allow creating a single Product_Item with multiple photos
3. THE Turgus_System SHALL display selected photos with visual indicators during selection
4. WHEN a Product_Item is created, THE Turgus_System SHALL associate all selected photos as a Product_Gallery for that item
5. THE Turgus_System SHALL prevent the same photo from being assigned to multiple Product_Items

### Requirement 3

**User Story:** As a seller, I want to add details to my product, so that I can provide complete information for buyers.

#### Acceptance Criteria

1. WHEN a Seller_User creates a Product_Item with selected photos, THE Turgus_System SHALL present a form for product details
2. THE Turgus_System SHALL require title, description, price, and at least one category for each Product_Item
3. THE Turgus_System SHALL validate that price is a positive decimal number
4. THE Turgus_System SHALL provide predefined categories for product classification and allow multiple category selection
5. THE Turgus_System SHALL save product details as draft until publication

### Requirement 4

**User Story:** As a seller, I want to publish completed products, so that buyers can see and purchase my items.

#### Acceptance Criteria

1. WHEN a Product_Item has complete details (title, description, price, at least one category, photos), THE Turgus_System SHALL enable publication
2. WHEN a Seller_User publishes a Product_Item, THE Turgus_System SHALL make it visible in the Product_Feed
3. THE Turgus_System SHALL set published Product_Items status to "available"
4. THE Turgus_System SHALL prevent modification of published Product_Items without unpublishing
5. THE Turgus_System SHALL notify the Seller_User of successful publication

### Requirement 5

**User Story:** As a buyer, I want to browse products in an Instagram-like feed, so that I can easily discover items I'm interested in.

#### Acceptance Criteria

1. WHEN a Buyer_User accesses the main interface, THE Turgus_System SHALL display the Product_Feed with product photos in a grid layout
2. THE Turgus_System SHALL show available products in full color and sold products in black and white
3. WHEN a Buyer_User has viewed a product, THE Turgus_System SHALL display an eye icon overlay on that product's photo
4. THE Turgus_System SHALL load additional products automatically when the user scrolls to the bottom of the feed
5. THE Turgus_System SHALL display products in chronological order by default (newest first)

### Requirement 6

**User Story:** As a buyer, I want to filter and sort the product feed, so that I can find specific types of items efficiently.

#### Acceptance Criteria

1. THE Turgus_System SHALL provide category-based filtering for the Product_Feed, allowing filtering by any of the product's assigned categories
2. THE Turgus_System SHALL provide filters for "seen/not seen" and "available/sold out" status
3. THE Turgus_System SHALL enable sorting by price (low to high, high to low) and creation date
4. WHEN filters are applied, THE Turgus_System SHALL update the Product_Feed to show only matching products
5. THE Turgus_System SHALL maintain filter and sort preferences during the user session

### Requirement 7

**User Story:** As a buyer, I want to view detailed product information, so that I can make informed purchasing decisions.

#### Acceptance Criteria

1. WHEN a Buyer_User clicks on a product photo, THE Turgus_System SHALL display the product detail page
2. THE Turgus_System SHALL show product title, description, price, categories, and all photos on the detail page
3. THE Turgus_System SHALL provide a comment section for buyer questions and seller responses
4. THE Turgus_System SHALL display an "I want this" button for available products
5. THE Turgus_System SHALL mark the product as "viewed" by the current Buyer_User

### Requirement 8

**User Story:** As a buyer, I want to express interest in products, so that I can reserve items I intend to purchase.

#### Acceptance Criteria

1. WHEN a Buyer_User clicks "I want this" on an available product, THE Turgus_System SHALL add the product to their Want_List
2. WHEN a product is added to a Want_List, THE Turgus_System SHALL change the product status to "reserved"
3. THE Turgus_System SHALL prevent other Buyer_Users from adding reserved products to their Want_List
4. THE Turgus_System SHALL notify the product's Seller_User when a product is added to a Want_List
5. THE Turgus_System SHALL display reserved products as unavailable in the Product_Feed

### Requirement 9

**User Story:** As a buyer, I want to manage my list of wanted items, so that I can review and modify my selections before finalizing.

#### Acceptance Criteria

1. THE Turgus_System SHALL provide a Want_List interface showing all products the Buyer_User has reserved
2. THE Turgus_System SHALL allow Buyer_Users to remove individual products from their Want_List
3. WHEN a product is removed from a Want_List, THE Turgus_System SHALL return the product status to "available"
4. THE Turgus_System SHALL display total price and item count for the Want_List
5. THE Turgus_System SHALL enable Buyer_Users to communicate completion of selection to the Seller_User

### Requirement 10

**User Story:** As a seller, I want to view buyer want lists, so that I can manage orders and coordinate sales.

#### Acceptance Criteria

1. THE Turgus_System SHALL display all Want_Lists containing the Seller_User's products
2. THE Turgus_System SHALL show Buyer_User information and selected products for each Want_List
3. THE Turgus_System SHALL enable Seller_Users to cancel entire Want_Lists or individual products
4. WHEN a Seller_User cancels a Want_List item, THE Turgus_System SHALL return the product to "available" status
5. WHEN a Want_List becomes empty, THE Turgus_System SHALL automatically cancel the entire Want_List

### Requirement 11

**User Story:** As a user, I want to use the application in Portuguese or English, so that I can interact with the system in my preferred language.

#### Acceptance Criteria

1. THE Turgus_System SHALL display all interface elements in Portuguese by default
2. THE Turgus_System SHALL provide a language toggle to switch between Portuguese and English
3. WHEN language is changed, THE Turgus_System SHALL update all static text and labels immediately
4. THE Turgus_System SHALL maintain language preference across user sessions
5. THE Turgus_System SHALL support Portuguese and English text input for product descriptions and comments
### R
equirement 12

**User Story:** As a user, I want to access Turgus on my mobile device with an optimized experience, so that I can use the platform efficiently on-the-go.

#### Acceptance Criteria

1. THE Turgus_System SHALL prioritize mobile device compatibility and performance
2. THE Turgus_System SHALL provide responsive design that adapts to different screen sizes
3. THE Turgus_System SHALL optimize touch interactions for mobile gestures (tap, swipe, pinch-to-zoom)
4. THE Turgus_System SHALL ensure fast loading times on mobile networks
5. THE Turgus_System SHALL maintain full functionality across mobile browsers and progressive web app capabilities### Req
uirement 13

**User Story:** As a seller, I want to access my predefined seller account, so that I can manage my products and sales.

#### Acceptance Criteria

1. THE Turgus_System SHALL provide a predefined Seller_Account with username "Bazar dos BUts"
2. THE Turgus_System SHALL authenticate the Seller_Account using password "paladino0"
3. WHEN the Seller_User logs in successfully, THE Turgus_System SHALL provide access to product management features
4. THE Turgus_System SHALL maintain the seller session until explicit logout
5. THE Turgus_System SHALL restrict seller features to authenticated Seller_Account only

### Requirement 14

**User Story:** As a buyer, I want to create my own account, so that I can purchase products and manage my want list.

#### Acceptance Criteria

1. THE Turgus_System SHALL provide a buyer registration form requiring name, telephone, and address
2. THE Turgus_System SHALL validate that all three fields (name, telephone, address) are provided and not empty
3. WHEN a Buyer_User completes registration, THE Turgus_System SHALL create a new Buyer_Account
4. THE Turgus_System SHALL enable Buyer_Users to log in using their registered credentials
5. THE Turgus_System SHALL associate Want_Lists and product interactions with the authenticated Buyer_Account