import React, { useState } from "react";
import jsPDF from 'jspdf';
import axios from "../utils/axiosConfig";

function Upload() {
  const [file, setFile] = useState(null);
  const [sectionToShow, setSectionToShow] = useState("TEXT");
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(false);


  const handleFileUpload = (e) => {
    setResultData(null);
    setLoading(false);
    setFile(e.target.files[0]);
  };

  const generateAudio = async () => {
    try {
      setLoading(true);
      let formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        "http://localhost:5000/generate-audio",
        formData,
        {
          responseType: "blob",
        }
      );

      const audioBlob = new Blob([response.data], { type: "audio/wav" });
      setResultData(URL.createObjectURL(audioBlob));
      setLoading(false);
    } catch (error) {
      console.error("Error generating audio:", error);
    }
  };

  const generateText = async () => {
    try {
      setLoading(true);
      let formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        "http://localhost:5000/transcribe",
        formData
      );
      setResultData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error generating audio:", error);
    }
  };

  const downloadAudio = () => {
    if (!resultData) {
      console.error("No audio data available for download.");
      return;
    }

    const a = document.createElement("a");
    a.href = resultData;
    a.download = `${Date.now()}_audio`;
    document.body.appendChild(a);
    a.click();
    handleSection("TEXT");
    document.body.removeChild(a);
  };

  const handleSection = (status) => {
    setSectionToShow(status);
    setFile(null);
    setResultData(null);
    handleResetFile();
    setLoading(false);
  };

  const downloadTextFile = (status) => {
    if (!resultData) {
      console.error("No text available.");
      return;
    }

    const audioBlob = new Blob([resultData], { type: "text/plain" });
    const url = URL.createObjectURL(audioBlob);

    // Create an anchor element
    const a = document.createElement("a");
    a.href = url;
    a.download = `${Date.now()}_text`; // Set the file name
    document.body.appendChild(a);
    a.click();
    handleSection("AUDIO");
    document.body.removeChild(a);
  };

  const handleResetFile = () => {
    const fileInput = document.getElementById("myTextInput");
    const audioInput = document.getElementById("myAudioInput");
    if (fileInput) {
      fileInput.value = null;
    }
    if (audioInput) {
      audioInput.value = null;
    }
  };

 

  const handleDownloadPDF = () => {
   
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.setFont("helvetica");
    const textWidth = doc.internal.pageSize.width - 20; // Subtracting margins
    const textHeight = doc.internal.pageSize.height - 20; // Subtracting margins
    const textLines = doc.splitTextToSize(resultData, textWidth);

    let yPosition = 20;
    textLines.forEach(line => {
     
      if (yPosition + 10 > textHeight) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(10, yPosition, line);
      yPosition += 10; 
    });

    doc.save(`${Date.now()}.pdf`);
  };

  return (
    <div className="m-4">
      <h2 className="my-4 text-3xl font-bold"> Upload file to convert</h2>

      <div className="w-fit border my-3">
        <div
          className={`${
            sectionToShow === "TEXT"
              ? "bg-slate-700 text-rose-50"
              : " bg-slate-50 text-gray-950"
          } cursor-pointer inline p-3 rounded border-gray-800 border-solid`}
          onClick={() => handleSection("TEXT")}
        >
          Text File
        </div>
     
      </div>

      {sectionToShow === "TEXT" ? (
        <React.Fragment>
          {" "}
          <input
            className="mt-4"
            type="file"
            accept=".txt,.pdf"
            id="myTextInput"
            onChange={handleFileUpload}
          />
          {file && (
            <button
              className="block my-4  bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={generateAudio}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Audio"}
            </button>
          )}
          {resultData && (
            <>
              <audio controls className="my-4">
                <source src={resultData} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded block"
                onClick={downloadAudio}
              >
                Download Audio
              </button>
            </>
          )}
        </React.Fragment>
      ) : (
        <React.Fragment>
          {" "}
          <input
            className="mt-4"
            type="file"
            accept="audio/*"
            id="myAudioInput"
            onChange={handleFileUpload}
          />
          {file && (
            <button
              className="block my-4  bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={generateText}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Text"}
            </button>
          )}
          {resultData && (
            <>
           
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded block my-3"
                onClick={() => downloadTextFile("text")}
              >
                Download Text File
              </button>
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded block my-3"
                onClick={() => handleDownloadPDF()}
            >
              Download PDF File
            </button>
            </>
          )}
        </React.Fragment>
      )}
    </div>
  );
}

export default Upload;
