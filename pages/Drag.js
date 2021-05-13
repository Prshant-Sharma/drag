import React, { Component, useCallback, useMemo, useState , useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { FadeLoader } from "react-spinners";
import SnackBarComponent from "../components/SnackBar/SnackBar";
import {
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  FormControlLabel,
  Checkbox,
  IconButton,
} from "@material-ui/core";
import 'abortcontroller-polyfill';
import { URLDATA } from "../components/Config";
import { useDropzone } from "react-dropzone";
var controller = new AbortController();
let signal = controller.signal;
import CloseIcon from "@material-ui/icons/Close";
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import _ from "lodash";
import CircularProgress from "../components/CircularProgress";
import axios from "axios";
import { ProgressBar } from 'react-bootstrap'

function Dropzone(props) {
  const onDrop = useCallback((files) => {
    let zipFile = files;
    // console.log(zipFile,"Zip File")
    zipFile = files
      ? files.filter(
          (item) => item.type.includes("zip") && item.name.includes("zip")
        ).length
        ? files.filter(
            (item) => item.type.includes("zip") && item.name.includes("zip")
          )
        : files.filter(
            (item) => !item.type.includes("rar") && !item.name.includes("rar") && !item.type.includes("msi") && !item.name.includes("msi")
          )
      : files.filter(
          (item) => !item.type.includes("rar") && !item.name.includes("rar") && !item.type.includes("msi") && !item.name.includes("msi")
        );
    zipFile = zipFile.sort(function (a, b) {
      return a.name - b.name;
    });
    if (
      zipFile.filter(
        (item) => item.type.includes("zip") && item.name.includes("zip")
      ).length > 1
    ) {
      props.FileError("Multiple zip files are not supported.");
    } else {
      if (
        zipFile.filter(
          (item) => item.type.includes("zip") && item.name.includes("zip")
        ).length
      ) {
        getFileContext(zipFile);
      }
      else {
      props.fileData(zipFile, "");
      }
    }
  });
  const onDropRejected = (rejectedFiles) => {
    return (
      rejectedFiles &&
      rejectedFiles.length &&
      rejectedFiles[0].errors.map((item) => {
        if (item.code === "file-too-large")
          props.FileError(
            "File is too large. The maximum file size allowed is 1 GB."
          );
        else return null;
      })
    );
    // })
  };

  const getFileContext = (files) => {
    resetChunkProperties();
    const _file = files[0];
    setFileSize(_file.size)

    const _totalCount = _file.size % chunkSize == 0 ? _file.size / chunkSize : Math.floor(_file.size / chunkSize) + 1; // Total count of chunks need to be uploaded to finish the file
    setChunkCount(_totalCount)

    const _fileID = uuidv4() + "." + _file.name.split('.').pop();
    setFileGuid(_fileID)
    setFileToBeUpload(_file)

  }

  const fileUpload = () => {
    setCounter(counter + 1);
    // console.log(fileToBeUpload , "File Upload()")
    const _fileID = fileGuid  
    if (counter <= chunkCount) {
      var chunk = fileToBeUpload.slice(beginingOfTheChunk, endOfTheChunk);
      uploadChunk(chunk,fileGuid);
      props.fileSaveButton(true)
    }
  };

  const uploadChunk = async (chunk,file) => {
    try {
      const response = await axios.post(
        URLDATA.ctchunks,
        chunk,
        {
          params: {
            id: counter,
            fileName: fileGuid ? fileGuid : file,
          },
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = response.data;
      // console.log(data,"data")
      // debugger
      if (data.isSuccess) {
        setBeginingOfTheChunk(endOfTheChunk);
        setEndOfTheChunk(endOfTheChunk + chunkSize);
        if (counter == chunkCount) {
          // console.log("Process is complete, counter", counter);

          await uploadCompleted();
        } else {
          var percentage = (counter / chunkCount) * 100;
          setProgress(percentage);
        }
      } else {
        props.uploadError(data.error)
        console.log("Error Occurred:", data.errorMessage);
      }
    } catch (error) {
      props.uploadError( error.message )
      console.log("error", error);
    }
  };

  const uploadCompleted = async () => {
    var formData = new FormData();
    // console.log(fileGuid, "File name")
    formData.append("fileName", fileGuid);

    const response = await axios.post(
      URLDATA.ctcomplete,
      {},
      {
        params: {
          fileName: fileGuid,
          count:counter,
        },
        data: formData,
      }
    );
    const data = response.data;
    // console.log("Complete")
    if (data.isSuccess) {
      setProgress(0);
      setShowProgress(false)
      props.zipFileUpload(fileGuid , [fileToBeUpload])
      props.fileSaveButton(false)
    }
  };

  const resetChunkProperties = () => {
    props.FileError("")
    setShowProgress(true)
    setProgress(0)
    setCounter(1)
    setBeginingOfTheChunk(0)
    setEndOfTheChunk(chunkSize)
  }
  const activeStyle = {
    backgroundColor: "#79B3C6",
  };
  let {
    getRootProps,
    getInputProps,
    open,
    acceptedFiles,
    fileRejections,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    // Disable click and keydown behavior
    noClick: true,
    noKeyboard: true,
    onDrop,
    onDropRejected,
    multiple: true,
    accept: ".jpeg, .png, .dcm, .dicom, .zip,",
    maxSize: 1073741824,
  });
  const chunkSize = 1048576 * 3;
  const [showProgress, setShowProgress] = useState(false);
  const [counter, setCounter] = useState(1);
  const [fileToBeUpload, setFileToBeUpload] = useState({});

  const [beginingOfTheChunk, setBeginingOfTheChunk] = useState(0);
  const [endOfTheChunk, setEndOfTheChunk] = useState(chunkSize);
  const [progress, setProgress] = useState(0);
  const [fileGuid, setFileGuid] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [chunkCount, setChunkCount] = useState(0);
  
  useEffect(() => {
    if (fileSize > 0) {
      fileUpload(counter);
    }
    // console.log("fileGuid",fileGuid)
  }, [fileToBeUpload, progress ])
  const style = useMemo(
    () => ({
      ...(isDragActive ? activeStyle : {}),
    }),
    [isDragActive, isDragReject, isDragAccept]
  );

  const formatBytes = (bytes, decimals = 2) =>{
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }


  const zipFile = acceptedFiles
    .filter((file) => file.type.includes("zip") && file.name.includes("zip"))
    .map((file, index) =>
      file.type.includes("zip") && file.name.includes("zip") && index === 0 ? (
        <li key={file.path}>
          <span>
            {file.path} - {formatBytes(file.size)}
          </span>{" "}
          <IconButton
            onClick={(e) => {
              acceptedFiles.splice(acceptedFiles.indexOf(file), 1);
              props.removeFile(file);
            }}
          >
            <CloseIcon />
          </IconButton>
        </li>
      ) : (
        ""
      )
    );
  acceptedFiles = zipFile.length
    ? zipFile
    : acceptedFiles.sort(function (a, b) {
        return a.name - b.name;
      });
  const files = zipFile.length
    ? zipFile
    : acceptedFiles
        .filter(
          (item) => !item.type.includes("rar") && !item.name.includes("rar") && !item.type.includes("msi") && !item.name.includes("msi")
        )
        .map((file) => (
          <li key={file.path}>
            <span>
              {file.path} - {formatBytes(file.size)}
            </span>{" "}
            <IconButton
              onClick={(e) => {
                acceptedFiles.splice(acceptedFiles.indexOf(file), 1);
                props.removeFile(file);
              }}
            >
              <CloseIcon />
            </IconButton>
          </li>
        ));
  const progressInstance = <ProgressBar now={progress} label={`${progress.toFixed(3)}%`} />;
  return (
    <div className="container">
      <div {...getRootProps({ className: "dropzone", style })}>
        <input {...getInputProps()} accept=".dcm,.dicom,.zip" />
        <CloudUploadIcon />
        <p>Drag &amp; Drop file here</p>
        <p>or</p>
        <Button onClick={()=>open()} disabled={showProgress}>Browse File</Button>
        {files.length && !props.removeAllFile && !showProgress? (
          <div className="fileContainer">
            <ul>{files}</ul>
          </div>
        ) : (
          ""
        )}
        <div style={{display: showProgress ? "block" : "none" }} className="progressStyle">
          {progressInstance}
        </div>
      </div>
    </div>
  );
}

function Drag() {
  const chunkSize = 1048576;
  const [state, setState] = useState({
    loading: false,
    open: false,
    severity: "",
    alertmsg: "",
    siteOptions: [],
    files: "",
    errors: {},
    errorMessages: {},
    isFileUpload: false,
    saveButtonDisabled: false,
    rescanmodal: false,
    uploading: false,
    fileCount: 0,
    showProgress:false,
    counter:1,
    fileToBeUpload:{},
    beginingOfTheChunk:0,
    endOfTheChunk:chunkSize,
    progress:0,
    fileGuid:"",
    fileSize :0 ,
    chunkCount : 0
  })

  useEffect(() => {
    handleFileUpload();
  }, [state.files])

  const openDropZone = (items) => {
    return (
      <div className="UploadCt">
        <Dropzone
          fileData={(file, error) => fileData(file, items, error)}
          removeAllFile = {!state.files.length}
          FileError={(err) => fileError(err)}
          removeFile={(file) => removeFile(file)}
          zipFileUpload={(zipFileName , files) => setState({ filename: [{ uploadedFilename: zipFileName, file: files[0] }] , files })}
          fileSaveButton={(val) => setState({saveButtonDisabled: val})}
          uploadError={(error) => setState({
            open: true,
            severity: "error",
            alertmsg: error,
            loading: false,
            isFileUpload: false,
            saveButtonDisabled: false,
            timer: 3000,
          })}
        />
        {state.fileErrorMsg ? (
          <FormHelperText>{state.fileErrorMsg}</FormHelperText>
        ) : (
          ""
        )}
      </div>
    );
  }

  const fileError = (err) => {
    setState({...state, fileErrorMsg: err });
  };

  const removeFile = (file) => {
    let { filename, files } = state;
    filename = filename.filter((item) => item.file.name !== file.name);
    files = files.filter((item) => item.name !== file.name);
    // console.log(filename,"Filename")
    if (files && !files.length)
      fileError("A file or zip file is mandatory.");
    setState({...state, filename, files, rescanIntervaporId: undefined , rescan: false});
  };

  const fileData = (file, formData, error) => {
    let noErrors = true;
    setState(
      {...state,
        files: file,
        fileErrorMsg: error ? error : "",
        saveButtonDisabled: error,
        uploading: error,
      },
      () => {
        if (noErrors) handleFileUpload();
      }
    );
  };

  const fileUploadQuery = (url, request) =>
    fetch(url, request)
    .then((response) => response.json())
    .then((res) => {
      if (res.result && res.result.files) {
        if (res.result.files.ctscans.length) {
          const fileData = res.result.files.ctscans.map(
            (ctItem) => ctItem.name
          );
          return { fileData, error: null, apiCall: true };
        } else {
          return { fileData: [], error: null, apiCall: true };
        }
      } else {
        let message = res.error ? res.error.message : res.message;
        setState({...state,
          open: true,
          severity: "error",
          alertmsg: message,
          uploading: false,
          isFileUpload: false,
          saveButtonDisabled: true,
          timer: 3000,
        });
        return { fileData: [], error: message, apiCall: true };
      }
    })
    .catch((error) => {
      setState({...state,
        open: true,
        severity: "error",
        alertmsg: error.message,
        uploading: false,
        isFileUpload: false,
        saveButtonDisabled: true,
        timer: 3000,
      });
      return { fileData: [], error: error.message, apiCall: true };
  });

  const cancelFileUpload = (e) => {
    controller.abort();
    setState((prevState) => {
      return {...state, files: [], filename: null, saveButtonDisabled: false };
    });
  };

  const handleFileUpload = async (fileStatus = [], UploadedFile = []) => {
    let { files } = state;
    if (files && files.length) {
      let formData = new FormData();
      let batchfiles = _.chunk(files, 20);
      let FileStatus = !fileStatus.length
        ? batchfiles.map((item) => {
            return { status: false, item };
          })
        : fileStatus;
      let uploadedFiles = UploadedFile;
      if (signal.aborted) {
        controller = new AbortController();
        signal = controller.signal;
      }
      var requestOptions = {
        method: "POST",
        body: formData,
        redirect: "follow",
        // headers: {
        //   access_token: localStorage.getItem("token"),
        // },
      signal: signal,
      };
      setState({...state,
        saveButtonDisabled: true,
        uploading: true,
        filename: [],
      });
      await Promise.all(
        batchfiles.map(async (batchItem, batchIndex) => {
          formData.delete("ctscans");
          await Promise.all(
            batchItem.map(async (fileItem, index, arr) => {
              if (arr.length === index + 1) {
                formData.append("ctscans", fileItem);
                if (
                  !FileStatus[batchIndex].status &&
                  (batchIndex === 0 ||
                    (FileStatus[batchIndex - 1] &&
                      FileStatus[batchIndex - 1].status === true))
                ) {
                  let queryData = await fileUploadQuery(
                    URLDATA.cturl,
                    requestOptions
                  );
                  FileStatus[batchIndex].status = queryData.apiCall
                    ? true
                    : false;
                  if (FileStatus[batchIndex].status) {
                    uploadedFiles = [...uploadedFiles, ...queryData.fileData];
                    setState({...state, fileCount: uploadedFiles.length }, () =>
                      handleFileUpload(FileStatus, uploadedFiles)
                    );
                  }
                }
              } else {
                formData.append("ctscans", fileItem);
                return fileItem;
              }
            })
          );
          return batchItem;
        })
      );

      if (FileStatus.filter((item) => item.status).length == FileStatus.length)
        setState({...state,
          filename: uploadedFiles.map((item, index) => {
            return { uploadedFilename: item, file: files[index] };
          }),
          uploading: false,
          saveButtonDisabled: !(
            FileStatus.map((item) => item.item).flat().length === files.length
          ),
        });
    } else {
      setState({...state,
        fileErrorMsg: files && files.length ? "" : "A file or zip file is mandatory.",
        uploading: false,
        isFileUpload: false,
        saveButtonDisabled: false,
        filename: null,
        files: files,
      });
    }
  };

  return(
      <div className="uploadCT">
        <div className="UploadForm">
        {state.uploading ? (
        <div className={`Loader Upload`}>
            {state.fileCount && (
            <FadeLoader
                style={{ height: "15", width: "5", radius: "2" }}
                color={"#6FABF0"}
                loading={state.uploading}
            />
            )}
            <div>
              {state.fileCount ? (
                  <div>
                    <CircularProgress
                        value={
                        (state.fileCount / state.files.length) * 100
                        }
                        className="uploadingLoader"
                    />
                    <h4>
                        Uploaded {state.fileCount} out of {" "}
                        {state.files.length} files
                    </h4>
                  </div>
              ) : (
                  <h4>Uploading...</h4>
              )}
              <a onClick={cancelFileUpload} className="canceluploadbtn">
                Cancel
              </a>
            </div>
        </div>
        ) : (
        ""
        )}
        {state.loading ? (
          <div className="Loader Upload">
            <FadeLoader
              style={{ height: "15", width: "5", radius: "2" }}
              color={"#6FABF0"}
              loading={state.loading}
            />
            <div>
              <h4
                style={{
                marginTop: "20px",
                }}
              >
                Saving...
              </h4>
              <a onClick={cancelFileUpload} className="canceluploadbtn">
                Cancel
              </a>
            </div>
          </div>
        ) : (
        ""
        )}
        {state.open ? (
          <SnackBarComponent
            severity={state.severity}
            open={state.open}
            alertmsg={state.alertmsg}
            timer={state.timer}
            // handleClose={handleSnackBarClose}
            className="addUserSnackBar"
          />
        ) : (
        ""
        )}
        <h2>Upload Files</h2>
        <div className="formComponent">
          {
            openDropZone()
          }
        </div>
      </div>
    </div>
  )
}

// class Drag extends Component {
//     constructor(props) {
//         super(props);
//         this.chunkSize = 1048576 * 1;
//         this.state = {
//           loading: false,
//           open: false,
//           severity: "",
//           alertmsg: "",
//           siteOptions: [],
//           files: "",
//           errors: {},
//           errorMessages: {},
//           isFileUpload: false,
//           saveButtonDisabled: false,
//           rescanmodal: false,
//           uploading: false,
//           fileCount: 0,
//           showProgress:false,
//           counter:1,
//           fileToBeUpload:{},
//           beginingOfTheChunk:0,
//           endOfTheChunk:this.chunkSize,
//           progress:0,
//           fileGuid:"",
//           fileSize :0 ,
//           chunkCount : 0
//         }; 
//     }

//     openDropZone = (items) => {
//         return (
//           <div className="UploadCt">
//             <Dropzone
//               fileData={(file, error) => this.fileData(file, items, error)}
//               removeAllFile={!this.state.files.length}
//               FileError={(err) => this.fileError(err)}
//               removeFile={(file) => this.removeFile(file)}
//               zipFileUpload={(zipFileName , files)=>this.setState({ filename:[{ uploadedFilename: zipFileName, file: files[0] }] , files })}
//               fileSaveButton={(val)=>this.setState({saveButtonDisabled:val})}
//               uploadError={(error)=>this.setState({
//                 open: true,
//                 severity: "error",
//                 alertmsg: error,
//                 loading: false,
//                 isFileUpload: false,
//                 saveButtonDisabled: false,
//                 timer: 3000,
//               })}
//             />
//             {this.state.fileErrorMsg ? (
//               <FormHelperText>{this.state.fileErrorMsg}</FormHelperText>
//             ) : (
//               ""
//             )}
//           </div>
//         );
//     };

//     fileError = (err) => {
//         this.setState({ fileErrorMsg: err });
//     };
//     removeFile = (file) => {
//         let { filename, files } = this.state;
//         filename = filename.filter((item) => item.file.name !== file.name);
//         files = files.filter((item) => item.name !== file.name);
//         // console.log(filename,"Filename")
//         if (files && !files.length)
//           this.fileError("A file or zip file is mandatory.");
//         this.setState({ filename, files, rescanIntervaporId:undefined , rescan:false});
//     };
//     fileData = (file, formData, error) => {
//         let noErrors = true;
//         this.setState(
//           {
//             // errors,
//             // errorMessages,
//             files: file,
//             fileErrorMsg: error ? error : "",
//             saveButtonDisabled: error,
//             uploading: error,
//           },
//           () => {
//             if (noErrors) this.handleFileUpload();
//           }
//         );
//     };
//     fileType = (file) => {
//         const filereader = new FileReader();
//         const blob = file[0];
//         filereader.onloadend = function (evt) {
//           if (evt.target.readyState === FileReader.DONE) {
//             const uint = new Uint8Array(evt.target.result);
//             let bytes = [];
//             uint.forEach((byte) => {
//               bytes.push(byte.toString(16));
//             });
//             const hex = bytes.join("").toUpperCase();
//             console.log(hex, "Hex code ");
//           }
    
//           console.timeEnd("FileOpen");
//         };
    
//         filereader.readAsArrayBuffer(blob);
//     };


//     fileUploadQuery = (url, request) =>
//     fetch(url, request)
//       .then((response) => response.json())
//       .then((res) => {
//         if (res.result && res.result.files) {
//           if (res.result.files.ctscans.length) {
//             const fileData = res.result.files.ctscans.map(
//               (ctItem) => ctItem.name
//             );
//             return { fileData, error: null, apiCall: true };
//           } else {
//             return { fileData: [], error: null, apiCall: true };
//           }
//         } else {
//           let message = res.error ? res.error.message : res.message;
//           this.setState({
//             open: true,
//             severity: "error",
//             alertmsg: message,
//             uploading: false,
//             isFileUpload: false,
//             saveButtonDisabled: true,
//             timer: 3000,
//           });
//           return { fileData: [], error: message, apiCall: true };
//         }
//       })
//       .catch((error) => {
//         this.setState({
//           open: true,
//           severity: "error",
//           alertmsg: error.message,
//           uploading: false,
//           isFileUpload: false,
//           saveButtonDisabled: true,
//           timer: 3000,
//         });
//         return { fileData: [], error: error.message, apiCall: true };
//     });
//     cancelFileUpload = (e) => {
//         controller.abort();
//         this.setState((prevState) => {
//           return { files: [], filename: null, saveButtonDisabled: false };
//         });
//       };

//     handleFileUpload = async (fileStatus = [], UploadedFile = []) => {
//         let { files } = this.state;
//         if (files && files.length) {
//           let formData = new FormData();
//           let batchfiles = _.chunk(files, 20);
//           let FileStatus = !fileStatus.length
//             ? batchfiles.map((item) => {
//                 return { status: false, item };
//               })
//             : fileStatus;
//           let uploadedFiles = UploadedFile;
//           if (signal.aborted) {
//             controller = new AbortController();
//             signal = controller.signal;
//           }
//           var requestOptions = {
//             method: "POST",
//             body: formData,
//             redirect: "follow",
//             // headers: {
//             //   access_token: localStorage.getItem("token"),
//             // },
//            signal: signal,
//           };
//           this.setState({
//             saveButtonDisabled: true,
//             uploading: true,
//             filename: [],
//           });
//           await Promise.all(
//             batchfiles.map(async (batchItem, batchIndex) => {
//               formData.delete("ctscans");
//               await Promise.all(
//                 batchItem.map(async (fileItem, index, arr) => {
//                   if (arr.length === index + 1) {
//                     formData.append("ctscans", fileItem);
//                     if (
//                       !FileStatus[batchIndex].status &&
//                       (batchIndex === 0 ||
//                         (FileStatus[batchIndex - 1] &&
//                           FileStatus[batchIndex - 1].status === true))
//                     ) {
//                       let queryData = await this.fileUploadQuery(
//                         URLDATA.cturl,
//                         requestOptions
//                       );
//                       FileStatus[batchIndex].status = queryData.apiCall
//                         ? true
//                         : false;
//                       if (FileStatus[batchIndex].status) {
//                         uploadedFiles = [...uploadedFiles, ...queryData.fileData];
//                         this.setState({ fileCount: uploadedFiles.length }, () =>
//                           this.handleFileUpload(FileStatus, uploadedFiles)
//                         );
//                       }
//                     }
//                   } else {
//                     formData.append("ctscans", fileItem);
//                     return fileItem;
//                   }
//                 })
//               );
    
//               return batchItem;
//             })
//           );
    
//           if (FileStatus.filter((item) => item.status).length == FileStatus.length)
//             this.setState({
//               filename: uploadedFiles.map((item, index) => {
//                 return { uploadedFilename: item, file: files[index] };
//               }),
//               uploading: false,
//               saveButtonDisabled: !(
//                 FileStatus.map((item) => item.item).flat().length === files.length
//               ),
//             });
//         } else {
//           this.setState({
//             fileErrorMsg:
//               files && files.length ? "" : "A file or zip file is mandatory.",
//             uploading: false,
//             isFileUpload: false,
//             saveButtonDisabled: false,
//             filename: null,
//             files: files,
//           });
//         }
//     };

//     render(){
//         return(
//             <div className="uploadCT">
//                 <div className="UploadForm">
//                 {this.state.uploading ? (
//                 <div className={`Loader Upload`}>
//                     {!this.state.fileCount && (
//                     <FadeLoader
//                         style={{ height: "15", width: "5", radius: "2" }}
//                         color={"#6FABF0"}
//                         loading={this.state.uploading}
//                     />
//                     )}
//                     <div>
//                     {this.state.fileCount ? (
//                         <div>
//                         <CircularProgress
//                             value={
//                             (this.state.fileCount / this.state.files.length) * 100
//                             }
//                             className="uploadingLoader"
//                         />
//                         <h4>
//                             Uploaded {this.state.fileCount} out of{" "}
//                             {this.state.files.length} files
//                         </h4>
//                         </div>
//                     ) : (
//                         <h4>Uploading...</h4>
//                     )}
//                     <a onClick={this.cancelFileUpload} className="canceluploadbtn">
//                         Cancel
//                     </a>
//                     </div>
//                 </div>
//                 ) : (
//                 ""
//                 )}
//                 {this.state.loading ? (
//                 <div className="Loader Upload">
//                     <FadeLoader
//                     style={{ height: "15", width: "5", radius: "2" }}
//                     color={"#6FABF0"}
//                     loading={this.state.loading}
//                     />
//                     <div>
//                     <h4
//                         style={{
//                         marginTop: "20px",
//                         }}
//                     >
//                         Saving...
//                     </h4>
//                     <a onClick={this.cancelFileUpload} className="canceluploadbtn">
//                         Cancel
//                     </a>
//                     </div>
//                 </div>
//                 ) : (
//                 ""
//                 )}
//                 {this.state.open ? (
//                 <SnackBarComponent
//                     severity={this.state.severity}
//                     open={this.state.open}
//                     alertmsg={this.state.alertmsg}
//                     timer={this.state.timer}
//                     handleClose={this.handleSnackBarClose}
//                     className="addUserSnackBar"
//                 />
//                 ) : (
//                 ""
//                 )}
//                 <h2>Upload Files</h2>
//                     <div className="formComponent">
//                         {
//                             this.openDropZone()
//                         }
//                     </div>
                
//                 </div>
                
//             </div>


//         )
//     }
// }

export default Drag;