import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { Loader2, Upload, X, Search } from "lucide-react";

const BirdSpeciesTracker = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [sortBy, setSortBy] = useState("county");
  const [searchTerm, setSearchTerm] = useState("");

  const onDrop = useCallback((acceptedFiles) => {
    setFile(acceptedFiles[0]);
    handleFileUpload(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleFileUpload = (file) => {
    setLoading(true);
    Papa.parse(file, {
      complete: (results) => {
        setTimeout(() => {
          processData(results.data);
          setLoading(false);
        }, 3000);
      },
      header: true,
    });
  };

  const processData = (rawData) => {
    const countyData = {};
    rawData.forEach((row) => {
      if (row.County) {
        const { County, Date, "Taxonomic Order": species } = row;
        if (!countyData[County]) {
          countyData[County] = {};
        }
        if (!countyData[County][Date]) {
          countyData[County][Date] = new Set();
        }
        countyData[County][Date].add(species);
      }
    });

    const processedData = Object.entries(countyData).map(([county, dates]) => {
      const sortedDates = Object.entries(dates)
        .map(([date, species]) => ({ date, speciesCount: species.size }))
        .sort((a, b) => b.speciesCount - a.speciesCount)
        .slice(0, 3);
      return { county, dates: sortedDates };
    });

    setData(processedData);
  };

  const removeFile = () => {
    setFile(null);
    setData([]);
  };

  const filteredData = data.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return item.county.toLowerCase().includes(searchLower);
    //   ||
    //   item.dates.some((date) => {
    //     const [year, month, day] = date.date.split('-');
    //     return (
    //       year.includes(searchTerm) ||
    //       month.includes(searchTerm) ||
    //       day.includes(searchTerm) ||
    //       date.date.includes(searchTerm)
    //     );
    //   }
    // )
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === "county") {
      return a.county.localeCompare(b.county);
    } else {
      // Sort by the first date of each county, which is already the highest count, then sort all by species count
      return b.dates[0].speciesCount - a.dates[0].speciesCount;
      // return b.dates[0].date.localeCompare(a.dates[0].date);
    }
  });

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Birding Analytics</h1>

      <div
        {...getRootProps()}
        className="border-2 border-dashed p-4 mb-4 rounded-lg"
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the file here ...</p>
        ) : (
          <p>Drag & drop a CSV file here, or click to select a file</p>
        )}
        <div className="flex space-x-2 mb-4"></div>
      </div>

      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => document.querySelector('input[type="file"]').click()}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Upload className="mr-2" size={16} /> Upload
        </button>
        {file && (
          <button
            onClick={removeFile}
            className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <X className="mr-2" size={16} /> Remove File
          </button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center items-center mb-4">
          <Loader2 className="animate-spin mr-2" size={24} />
          <span>Loading...</span>
        </div>
      )}

      {data.length > 0 && (
        <div className="mb-4">
          <div className="flex space-x-2 mb-2">
            <button
              onClick={() => setSortBy("county")}
              className={`px-4 py-2 rounded-lg ${
                sortBy === "county" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              Sort by County
            </button>
            <button
              onClick={() => setSortBy("date")}
              className={`px-4 py-2 rounded-lg ${
                sortBy === "date" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              Sort by Date
            </button>
          </div>
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search by County"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border"
            />
            <Search
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
          </div>
          {sortedData.map((item) => (
            <div key={item.county} className="bg-gray-100 rounded-lg p-4 mb-2">
              {sortBy === "county" ? (
                <>
                  <h2 className="font-bold">{item.county}</h2>
                  <ul>
                    {item.dates.map((date) => (
                      <li key={date.date}>
                        {date.date}: {date.speciesCount} species
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <h2 className="font-bold">{item.dates[0].date}</h2>
                  <p>
                    {item.county}: {item.dates[0].speciesCount} species
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BirdSpeciesTracker;
