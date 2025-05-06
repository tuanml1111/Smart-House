import os
import pandas as pd
import psycopg2
from datetime import datetime

def collect_temperature_data(output_dir='data/raw'):
    """
    Collects temperature data from PostgreSQL database and saves it as CSV.
    
    Args:
        output_dir: Directory to save the CSV file
    
    Returns:
        str: Path to the saved CSV file
    """
    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created directory: {output_dir}")
    
    # Database connection parameters from .env
    db_params = {
        'user': 'postgres',
        'password': 'tuan',
        'host': 'localhost',
        'port': '5432',
        'database': 'yolohome1'
    }
    
    try:
        # Connect to the database
        print("Connecting to PostgreSQL database...")
        conn = psycopg2.connect(**db_params)
        cursor = conn.cursor()
        
        # Query to get temperature data
        # Adjust this query based on your actual database schema
        query = """
        SELECT s.recorded_time, s.svalue
        FROM sensor_data s
        JOIN sensor sen ON s.sensor_id = sen.sensor_id
        WHERE sen.sensor_type = 'temperature'
        ORDER BY s.recorded_time DESC
        """
        
        print("Executing query...")
        cursor.execute(query)
        rows = cursor.fetchall()
        
        if not rows:
            print("No temperature data found in the database.")
            return None
        
        print(f"Found {len(rows)} temperature records.")
        
        # Create DataFrame from query results
        df = pd.DataFrame(rows, columns=['recorded_time', 'temperature'])
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = os.path.join(output_dir, f'temperature_data_{timestamp}.csv')
        
        # Save to CSV
        df.to_csv(output_file, index=False)
        print(f"Temperature data saved to: {output_file}")
        
        # Close the database connection
        cursor.close()
        conn.close()
        
        return output_file
        
    except Exception as e:
        print(f"Error collecting temperature data: {str(e)}")
        return None

if __name__ == "__main__":
    # Call the function to collect and save temperature data
    output_file = collect_temperature_data()
    
    if output_file:
        print(f"Successfully collected temperature data: {output_file}")
        
        # Preview the data
        df = pd.read_csv(output_file)
        print("\nData Preview:")
        print(df.head())
        
        # Basic statistics
        print("\nBasic Statistics:")
        print(df.describe())
    else:
        print("Failed to collect temperature data.")