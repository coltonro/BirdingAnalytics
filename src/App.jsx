import { useState, useCallback, useMemo } from "react";
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

const BirdSpeciesTracker = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [sortBy, setSortBy] = useState("county");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentView, setCurrentView] = useState("analytics");
  const [selectedState, setSelectedState] = useState("All States");

  const onDrop = useCallback((acceptedFiles) => {
    setFile(acceptedFiles[0]);
    handleFileUpload(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleFileUpload = (file) => {
    setLoading(true);
    Papa.parse(file, {
      complete: (results) => {
        processData(results.data);
        setLoading(false);
        setCurrentView("analytics");
      },
      header: true,
    });
  };

  const processData = (rawData) => {
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
  };

  const filteredData = data.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (selectedState === "All States" || item.state === selectedState) &&
      item.county.toLowerCase().includes(searchLower)
    );
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

  const statesWithData = useMemo(() => {
    const states = new Set(data.map((item) => item.state));
    return ["All States", ...Array.from(states).sort()];
  }, [data]);

  const NavBar = () => (
    <nav className="bg-blue-500 p-4 flex justify-between items-center">
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
        {/* <button
          onClick={() => {
            document.querySelector('input[type="file"]').click()
          }}
          className={`text-white ${
            currentView === "upload" ? "font-bold" : ""
          }`}
        >
          Upload
        </button> */}
      </div>
    </nav>
  );

  const AboutView = () => (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">About Birding Analytics</h2>
      <p className="mb-4">
        Birding Analytics finds your Big Days for you. It shows birders which
        days they&apos;ve seen the most bird species.
      </p>
      <p className="mb-4">
        To use just upload your eBird data via a .csv file. You can get this
        from eBird&apos;s{" "}
        <a
          href="https://ebird.org/downloadMyData"
          target="_blank"
          rel="noopener noreferrer"
        >
          <u>MyData</u>
        </a>{" "}
        page.
      </p>
      <p className="mb-4">
        Birding Analytics currently only works with US states.
      </p>
      <p className="mb-4">
        This tool was created by me, Colton Robbins, a birder in central Texas.
        You can contact me at birdingoutfitter@gmail.com
      </p>
    </div>
  );

  return (
    <>
      <NavBar />
      {file !== null && file.type !== "text/csv" && (
        <div className="flex flex-col items-center mt-6">
          <div className="">File must be a .csv.</div>
          <div className="">Please refresh the page and try again.</div>
        </div>
      )}
      {!loading && file !== null && file.type === "text/csv" && Array.isArray(data) && data.length === 0 && (
        <div className="flex flex-col items-center mt-6">
          <div className="">File seems to be missing necessary columns like State, County, and Date.</div>
          <div className="">Please ensure your csv file is from eBird and isn&apos;t corrupted.</div>
          <div className="mt-6">Refresh the page to try again.</div>
        </div>
      )}
      {currentView === "about" ? (
        <AboutView />
      ) : (
        <div className="min-h-screen flex flex-col items-center">
          {!file && (
            <div
              {...getRootProps()}
              className="border-2 border-dashed p-4 my-4 rounded-lg"
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Drop the file here ...</p>
              ) : (
                <p>Drag & drop a CSV file here, or click to select a file</p>
              )}
              <div className="flex space-x-2 mb-4"></div>
            </div>
          )}

          {!file && (
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() =>
                  document.querySelector('input[type="file"]').click()
                }
                className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Upload className="mr-2" size={16} /> Upload
              </button>
            </div>
          )}

          {loading && (
            <div className="flex justify-center items-center my-6">
              <Loader2 className="animate-spin mr-2" size={24} />
              <span>Loading...</span>
            </div>
          )}

          {data.length > 0 && (
            <div className="my-4 min-w-[300px] w-[50%]">
              <div className="flex space-x-2 mb-2">
                <button
                  onClick={() => setSortBy("county")}
                  className={`px-4 py-2 rounded-lg ${
                    sortBy === "county"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Counties
                </button>
                <button
                  onClick={() => setSortBy("date")}
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
                  onChange={(event) => setSearchTerm(event.target.value)}
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
                      {statesWithData.map((state) => (
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
              {sortBy === "date" && (
                <h3 className="flex justify-center mb-6">
                  Top Big Day in each County
                </h3>
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
                        {item.state} - {item.county}:{" "}
                        {item.dates[0].speciesCount} species
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default BirdSpeciesTracker;
