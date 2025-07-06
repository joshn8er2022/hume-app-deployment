# ChromaDB Setup Instructions

## Prerequisites

Before running the HumeJourney application with ChromaDB, you need to have ChromaDB server running.

## Installation Options

### Option 1: Using Docker (Recommended)

1. Install Docker on your system
2. Run ChromaDB server:
```bash
docker run -p 8000:8000 chromadb/chroma
```

### Option 2: Using Python pip

1. Install Python 3.8+
2. Install ChromaDB:
```bash
pip install chromadb
```

3. Start ChromaDB server:
```bash
chroma run --host localhost --port 8000
```

### Option 3: Using conda

1. Install conda/miniconda
2. Create environment and install ChromaDB:
```bash
conda create -n chromadb python=3.10
conda activate chromadb
pip install chromadb
```

3. Start ChromaDB server:
```bash
chroma run --host localhost --port 8000
```

## Verification

Once ChromaDB is running, you should see output similar to:
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://localhost:8000
```

You can verify ChromaDB is running by visiting: http://localhost:8000/api/v1/heartbeat

## Running the Application

1. Ensure ChromaDB server is running on port 8000
2. Start the HumeJourney application:
```bash
npm run start
```

The application will automatically connect to ChromaDB and create the necessary collections.

## Important Notes

- ChromaDB is a vector database, which is different from traditional relational databases
- Data is stored as JSON documents with metadata for querying
- The application has been adapted to work with ChromaDB's document-based storage model
- All previous MongoDB functionality has been replaced with ChromaDB equivalents

## Troubleshooting

If you encounter connection issues:

1. Verify ChromaDB server is running: `curl http://localhost:8000/api/v1/heartbeat`
2. Check the CHROMA_URL in your .env file matches your ChromaDB server address
3. Ensure no firewall is blocking port 8000
4. Check ChromaDB server logs for any error messages