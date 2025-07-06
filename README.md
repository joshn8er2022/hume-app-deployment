# HumeJourney

HumeJourney is a modern client acquisition and onboarding application specifically designed for Hume Connect's clinic-focused business. The app transforms a manual, template-based process into an intelligent, personalized system through AI-driven personalization and automation, optimizing conversion rates and enhancing the client experience.

## Overview

The HumeJourney app is built using a modern technology stack with a clear separation between the frontend and backend. Below is a brief description of the architecture, technologies used, and the project structure.

### Architecture & Technologies
- **Frontend**: 
  - Built with **ReactJS** using the **Vite** development server.
  - Integrated with the **shadcn-ui** component library and **Tailwind CSS** for styling.
  - Client-side routing managed by **react-router-dom**.
  - Located in the `client/` folder and runs on port 5173.

- **Backend**: 
  - Built with **Express** for the API server.
  - Utilizes **MongoDB** for database operations with **Mongoose** for object modeling.
  - Manages REST API endpoints located in the `api/` folder.
  - Runs on port 3000.

- **Other Technologies**:
  - **Calendly** for scheduling
  - **Twilio** for SMS and voice communications
  - **OpenAI GPT-4** for natural language processing
  - **Intercom/Zendesk** for customer support ticketing

The project employs a mock data strategy for the frontend to ensure smooth development and testing without dependency on the live backend.

### Project Structure

- **Frontend** (`client/`):
  - `components/` - React components.
  - `api/` - Mock API requests integrated with backend.
  - `pages/` - Page components for routing.
  - `styles/` - Global styles and configuration.

- **Backend** (`server/`):
  - `config/` - Configuration files for database and other services.
  - `models/` - Mongoose schema definitions.
  - `routes/` - API route handlers.
  - `services/` - Business logic and interactions with models.
  - `utils/` - Utility functions for common tasks.

## Features

### Core User Flows
1. **Landing Page Experience**:
   - Tailored landing pages with clear pathways for different user types.
   - Enhanced with Video Sales Letters (VSLs) with engagement analytics.

2. **Application Process**:
   - Dynamic forms that adapt to user responses.
   - Integrated scheduling with Calendly.
   - Custom confirmation pages with relevant content.

3. **AI-Powered Lead Research & Scoring**:
   - Automated lead research incorporating LinkedIn and Clearbit data.
   - Intelligent lead scoring and qualification.

4. **Intelligent Follow-Up System**:
   - Pre-call engagement emails.
   - AI-managed qualification calls.
   
5. **Sales Call Experience**:
   - Personalized lead dossiers for sales teams.
   - Flexible offer structures.

6. **Post-Sale Onboarding Experience**:
   - Automated onboarding communication and scheduling.
   - AI-driven customer support.

7. **Fulfillment & Order Management**:
   - Automated tracking and updates for hardware fulfillment.
   - Ongoing relationship management with nurture sequences.

### Additional Features
- **Dashboard & Analytics**: Real-time conversion tracking, lead scoring, customer satisfaction metrics.
- **Communication Management**: Unified communication inbox, automated response suggestions.
- **AI Agent Capabilities**: Natural language processing, context-aware response generation.

## Getting Started

### Requirements
- **Node.js** (version 14.x or above)
- **npm** (version 6.x or above)
- MongoDB
- Environment setup with required services like Calendly, Twilio, OpenAI, etc.

### Quickstart
1. **Clone the repository**:
    ```bash
    git clone <repository-url>
    ```

2. **Navigate to the project folder**:
    ```bash
    cd HumeJourney
    ```

3. **Install all dependencies**:
    ```bash
    npm install
    ```

4. **Set up environment variables**:
    - Create a `.env` file in the `server/` directory and fill in the following details:
      ```env
      PORT=3000
      MONGO_URI=<Your MongoDB URI>
      JWT_SECRET=<Your JWT Secret>
      CALENDLY_API_KEY=<Your Calendly API Key>
      TWILIO_API_KEY=<Your Twilio API Key>
      OPENAI_API_KEY=<Your OpenAI API Key>
      ```

5. **Start the application**:
    ```bash
    npm run start
    ```
   This command will concurrently run both the frontend and backend servers.

### License
This project is proprietary.

```
© 2024 HumeJourney. All rights reserved.
```