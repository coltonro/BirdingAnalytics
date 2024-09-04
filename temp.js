import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { Loader2, Upload, Search, ChevronDown } from "lucide-react";

const stateAbbreviations = {
  "US-AL": "Alabama",
  "US-AK": "Alaska",
  "US-AZ": "Arizona",
  "US-AR": "Arkansas",
  "US-CA": "California",
  "US-CO": "Colorado",
  "US-CT": "Connecticut",
  "US-DE": "Delaware",
  "US-FL": "Florida",
  "US-GA": "Georgia",
  "US-HI": "Hawaii",
  "US-ID": "Idaho",
  "US-IL": "Illinois",
  "US-IN": "Indiana",
  "US-IA": "Iowa",
  "US-KS": "Kansas",
  "US-KY": "Kentucky",
  "US-LA": "Louisiana",
  "US-ME": "Maine",
  "US-MD": "Maryland",
  "US-MA": "Massachusetts",
  "US-MI": "Michigan",
  "US-MN": "Minnesota",
  "US-MS": "Mississippi",
  "US-MO": "Missouri",
  "US-MT": "Montana",
  "US-NE": "Nebraska",
  "US-NV": "Nevada",
  "US-NH": "New Hampshire",
  "US-NJ": "New Jersey",
  "US-NM": "New Mexico",
  "US-NY": "New York",
  "US-NC": "North Carolina",
  "US-ND": "North Dakota",
  "US-OH": "Ohio",
  "US-OK": "Oklahoma",
  "US-OR": "Oregon",
  "US-PA": "Pennsylvania",
  "US-RI": "Rhode Island",
  "US-SC": "South Carolina",
  "US-SD": "South Dakota",
  "US-TN": "Tennessee",
  "US-TX": "Texas",
  "US-UT": "Utah",
  "US-VT": "Vermont",
  "US-VA": "Virginia",
  "US-WA": "Washington",
  "US-WV": "West Virginia",
  "US-WI": "Wisconsin",
  "US-WY": "Wyoming",
};

const BirdingAnalytics = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [sortBy, setSortBy] = useState("county");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentView, setCurrentView] = useState("upload");
  const [selectedState, setSelectedState] = useState("All");

  console.log('Component Rerender')

  const onDrop = useCallback((acceptedFiles) => {
    setFile(acceptedFiles[0]);
    handleFileUpload(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  });

  const handleFileUpload = (file) => {
    setLoading(true);
    Papa.parse(file, {
      complete: (results) => {
        processData(results.data);
        setLoading(false);
        setCurrentView("analytics");
        // setTimeout(() => {
        //   processData(results.data);
        //   setLoading(false);
        //   setCurrentView('analytics');
        // }, 500);
      },
      header: true,
    });
  };

  const processData = (rawData) => {
    console.log('processData Rerender')
    const stateCountyData = {};
    rawData.forEach((row) => {
      if (row.County) {
        const {
          County,
          Date,
          "Taxonomic Order": species,
          "State/Province": stateAbbr,
        } = row;
        const state = stateAbbreviations[stateAbbr] || stateAbbr;
        if (!stateCountyData[state]) {
          stateCountyData[state] = {};
        }
        if (!stateCountyData[state][County]) {
          stateCountyData[state][County] = {};
        }
        if (!stateCountyData[state][County][Date]) {
          stateCountyData[state][County][Date] = new Set();
        }
        stateCountyData[state][County][Date].add(species);
      }
    });

    const processedData = Object.entries(stateCountyData).flatMap(
      ([state, counties]) =>
        Object.entries(counties).map(([county, dates]) => {
          const sortedDates = Object.entries(dates)
            .map(([date, species]) => ({ date, speciesCount: species.size }))
            .sort((a, b) => b.speciesCount - a.speciesCount)
            .slice(0, 3);
          return { state, county, dates: sortedDates };
        })
    );

    setData(processedData);
  };

  const removeFile = () => {
    setFile(null);
    setData([]);
    setCurrentView("upload");
  };

  const filteredData = data.filter((item) => {
    console.log('filteredData Rerender')
    const searchLower = searchTerm.toLowerCase();
    // return (
      return item.county.toLowerCase().includes(searchLower);
      // (selectedState === "All" || item.state === selectedState) &&
      //   item.county.toLowerCase().includes(searchLower)
      //  ||
      //  item.dates.some((date) => {
      //    const [year, month, day] = date.date.split('-');
      //    return (
      //      year.includes(searchTerm) ||
      //      month.includes(searchTerm) ||
      //      day.includes(searchTerm) ||
      //      date.date.includes(searchTerm)
      //    );
      //  })
    // );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === "county") {
      return a.county.localeCompare(b.county);
    } else {
      return b.dates[0].speciesCount - a.dates[0].speciesCount;
    }
  });

  const handleSortByCounty = useCallback(() => {
    setSortBy("county");
  }, []);
  
  const handleSortByDate = useCallback(() => {
    setSortBy("date");
  }, []);
  

  const NavBar = () => (
    <nav className="bg-blue-500 p-4 flex justify-between items-center">
      {console.log('NavBar Rerender')}
      <div className="flex items-center">
        <img src="/api/placeholder/50/50" alt="Logo" className="h-8 w-8 mr-2" />
      </div>
      <div className="text-white text-xl font-bold">Birding Analytics</div>
      <div className="flex items-center">
        <button
          onClick={() => setCurrentView("analytics")}
          className={`mr-4 text-white ${
            currentView === "analytics" ? "font-bold" : ""
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => setCurrentView("about")}
          className={`mr-4 text-white ${
            currentView === "about" ? "font-bold" : ""
          }`}
        >
          About
        </button>
        <button
          onClick={() => {
            setCurrentView("upload");
          }}
          className={`text-white ${
            currentView === "upload" ? "font-bold" : ""
          }`}
        >
          Upload
        </button>
      </div>
    </nav>
  );

  const UploadView = () => (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Upload CSV File</h2>
      <div 
      {...getRootProps()}>
        <input {...getInputProps()} />
      </div>

      {loading && (
        <div className="flex justify-center items-center mt-4">
          <Loader2 className="animate-spin mr-2" size={24} />
          <span>Uploading and processing file...</span>
        </div>
      )}
      <button
        onClick={() => document.querySelector('input[type="file"]').click()}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center"
      >
        <Upload className="mr-2" size={16} /> Upload
      </button>
    </div>
  );


  const AnalyticsView = () => (
    <div className="p-4 max-w-3xl w-[80%]">
      {loading && (
        <div className="flex justify-center items-center mb-4">
          <Loader2 className="animate-spin mr-2" size={24} />
          <span>Loading...</span>
        </div>
      )}
  {console.log('AnalyticsView Rerender')}
      {data.length > 0 && (
        <div className="mb-4">
          <div className="flex space-x-2 mb-2">
            <button
              onClick={handleSortByCounty}
              className={`px-4 py-2 rounded-lg ${
                sortBy === "county" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              Counties
            </button>
            <button
              onClick={handleSortByDate}
              className={`px-4 py-2 rounded-lg ${
                sortBy === "date" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              Rank by Date
            </button>
          </div>
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search by County"
              value={searchTerm}
              onChange={(e) => {e.preventDefault();setSearchTerm(e.target.value);
              }}
              className="w-full px-4 py-2 rounded-lg border"
            />
            <Search
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
          </div>
          {sortBy === "county" && (
            <div className="flex justify-center pb-3">
              <div className="relative inline-block text-left">
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded-lg leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="All">All States</option>
                  {Object.values(stateAbbreviations)
                    .sort()
                    .map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <ChevronDown size={20} />
                </div>
              </div>
            </div>
          )}
          {sortedData.map((item, index) => (
            <div
              key={`${item.state}-${item.county}-${index}`}
              className="bg-gray-100 rounded-lg p-4 mb-2"
            >
              {sortBy === "county" ? (
                <>
                  <h2 className="font-bold">
                    {item.state} - {item.county}
                  </h2>
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
                    {item.state} - {item.county}: {item.dates[0].speciesCount}{" "}
                    species
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const AboutView = () => (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">About Birding Analytics</h2>
      <p className="mb-4">
        Birding Analytics is a powerful tool designed to help birding
        enthusiasts and researchers analyze bird species data across different
        states and counties in the United States.
      </p>
      <p className="mb-4">
        Our application allows users to upload CSV files containing bird
        sighting data, and then provides insightful analytics about the top
        dates for bird species diversity in each location.
      </p>
      <p>
        To get started, click the &quote;Upload&quote; button in the navigation
        bar and select your CSV data file. Our system will process the
        information and present you with easy-to-understand analytics.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="flex justify-center">
        {currentView === "analytics" && <AnalyticsView />}
        {currentView === "about" && <AboutView />}
        {currentView === "upload" && <UploadView />}
      </main>
    </div>
  );
};

export default BirdingAnalytics;