import Papa from 'papaparse';
import JSZip from 'JSZip';
import { addMinutes, format, getDay, isBefore, isEqual, setHours, setMinutes } from 'date-fns';

const finalHeaders = [
    'meeting_point_name',
    'date',
    'start_time',
    'end_time',
    'title',
    'attendee_name',
    'attendee_organisation',
    'booker_name',
    'booker_organisation',
    'meeting_point_name',
    'also_attending',
] 

const fileInput = document.getElementById('csvFileInput');

// Test if FileReader API supported and attach listeners to file input
if(!window.FileReader) {
    document.body.classList.add('fr-unsupported');
} else {
    fileInput.addEventListener('change', () => handleFileUpload());
}

/* 
 * Handle adding of a file
 */
const handleFileUpload = () => {
    const selectedFile = fileInput.files[0];
    parseCSV(selectedFile);
};

/* 
 * Parse the input CSV
 */
const parseCSV = (fileObj) => {
    Papa.parse(fileObj, {
        header: true,
        complete: (results, file) => processData(results),
        error: (error, file) => {
            console.log('Error:', error, file);
        }
    });
};

/* 
 * Process the parsed results and split into days/tables etc.
 */
const processData = (results) => {

    // Replace date with JS usable start time 
    const processed = results.data.map((meeting) => {
        const {year, month, day} = getDateParts(meeting.date);
        const [startHour, startMinute] = meeting.start_time.split(/\:/);
        
        meeting.date = new Date(year, month, day, startHour, startMinute);
        return meeting;
    });

    const week = {};
    
    // Filter original array into individual days of the week
    for(let i = 0; i < 7; i++){
        week[dayOfWeekAsString(i)] = processed.filter(row => getDay(row.date) === i);
    };

    // Split days by location
    const appointmentsByLocation = splitWeekByTable(week);

    // Appointment details
    const aptLength = 20;
    const startHour = 9;
    const startMinute = 0;
    const endHour = 18;
    const endMinute = 0;

    // Initialise final object to hold result
    const finalApts = {};

    // Pad individual day/table combos and create final object
    Object.keys(appointmentsByLocation).forEach((day) => {
        // finalApts[day] = {};
        
        Object.keys(appointmentsByLocation[day]).forEach((table) => {
            const filename = `${day.toLowerCase()}-${table.toLowerCase().replace(/\s+/, '_')}.csv`;
            // const headers = Object.keys();
            const appointments = appointmentsByLocation[day][table];
            const today = appointments[0].date;
            let currentTime = setTime(today, startHour, startMinute);
            const endTime = setTime(today, endHour, endMinute);

            let aptIndex = 0;
            const paddedAppointments = [];

            while(isBefore(currentTime, endTime)){
                if(isEqual(appointments[aptIndex].date, currentTime)){
                    paddedAppointments.push(cleanObject(appointments[aptIndex]));
                    if(aptIndex < appointments.length - 1){
                        aptIndex++;
                    }
                } else {
                    paddedAppointments.push(createDummy(currentTime, aptLength));
                }
                currentTime = addMinutes(currentTime, aptLength);
            }
            finalApts[filename] = paddedAppointments;
        });
    });
    // Could also just create object of {filename: apts}?
    console.log(finalApts);
    createZip(finalApts);
};

const createZip = (obj) => {
    const zip = new JSZip();
    zip.file("Hello.txt", "Hello World\n");
    zip.generateAsync({type:"blob"})
        .then(function(content) {
            console.log(content);
            // see FileSaver.js
            // saveAs(content, "example.zip");

            const url = window.URL.createObjectURL(content);
      
            const href = url;
            const target = '_blank';
        
            // target filename
            const download = 'test.zip';

            const resultContainer = document.getElementById('results-link');
            const dlLink = document.createElement('a');
            dlLink.setAttribute('href', url);
            dlLink.setAttribute('target', target);
            dlLink.setAttribute('download', download);
            dlLink.innerHTML='download';

            resultContainer.appendChild(dlLink);

    });
}

const createDummy = (time, aptLength) => {
    return {
        title: 'Break',
        date: time,
        start_time: format(time, 'HH:mm'),
        end_time: format(addMinutes(time, aptLength), 'HH:mm'),
        attendee_name: "",
        attendee_organisation: "",
        booker_name: "",
        booker_organisation: "",
        meeting_point_name: ""
    };
};

// Remove any unnecessary data
const cleanObject = (obj) =>  {

    const toBeDeleted = [
        'attendee_email',
        'attendee_last_login',
        'confirmed_time',
        'created_time',
        'meeting_id',
        'meeting_point_id'
    ]

    const cleanObj = obj;

    toBeDeleted.forEach( dataKey => delete cleanObj[dataKey] );
    return cleanObj;
}


const setTime = (time, hour, minute) => {
    return setHours(setMinutes(time, minute), hour);
};

const sortByStartTime = (arr) => {
    arr.sort((a, b) => {
        return a.start_time.localeCompare(b.start_time);
    });
    return arr;
};

const splitWeekByTable = (week) => {
    const result = {};
    Object.keys(week).forEach((day) => {
        if(week[day].length > 0){
            result[day] = splitByTable(week[day]);
        } else {
            console.log('No appointments for ', day);
        }
    });
    return result;    
};

/* 
 * Split a monolothic set of appointments by unique location
 */
const splitByTable = (appointments) => {
    const unique = [...new Set(appointments.map(apt => apt.meeting_point_name))];
    let locations = {};

    unique.forEach(location => {
        locations[location] = appointments.filter(apt => apt.meeting_point_name === location);
        locations[location] = sortByStartTime(locations[location]);
    });
    return locations;
};

/* 
 * Helper function to convert day index to human readable
 */
const dayOfWeekAsString = (dayIndex) => {
    return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dayIndex];
};

/* 
 * Get individual date parts
 */
const getDateParts = (dateString, delim = '/') => {
    const dateParts = dateString.split(delim);
    return {
        year: dateParts[2],
        month: dateParts[1] - 1,
        day: dateParts[0],
    };
};
