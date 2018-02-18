import Papa from 'papaparse';
import JSZip from 'JSZip';
import { addMinutes, format, getDay, isBefore, isEqual, setHours, setMinutes } from 'date-fns';

const fileInput = document.getElementById('csvFileInput');

// Appointment details
const aptLength = 20;
const startHour = 9;
const startMinute = 0;
const endHour = 18;
const endMinute = 0;

const headers = [
    'start_time',
    'end_time',
    'attendee_name',
    'attendee_organisation',
    'booker_name',
    'booker_organisation',
    'meeting_point_name',
    'also_attending',
];

// Test if FileReader API supported and attach listeners to file input
if(!window.FileReader) {
    document.body.classList.add('fr-unsupported');
} else {
    fileInput.addEventListener('change', () => handleFileUpload());
}

const displayLoader = () => {
    console.log('Display a loader?');
};

const removeLoader = () => {
    console.log('Remove the loader?');
};

/* 
 * Handle adding of a file
 */
const handleFileUpload = () => {
    displayLoader();
    const selectedFile = fileInput.files[0];
    parseCSV(selectedFile);
};

/* 
 * Parse the input CSV
 */
const parseCSV = (fileObj) => {
    Papa.parse(fileObj, {
        header: true,
        complete: (results, file) => {
            removeLoader();
            processData(results);
        },
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

    // Initialise final object to hold result
    const finalApts = {};

    // Pad individual day/table combos and create final object
    Object.keys(appointmentsByLocation).forEach((day) => {        
        Object.keys(appointmentsByLocation[day]).forEach((table) => {
            const filename = `${day.toLowerCase()}-${table.toLowerCase().replace(/\s+/, '_')}.csv`;
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
                    paddedAppointments.push(createDummy(currentTime, aptLength, table));
                }
                currentTime = addMinutes(currentTime, aptLength);
            }
            finalApts[filename] = paddedAppointments;
        });
    });
    createZip(finalApts);
};

const createZip = (obj) => {
    const zip = new JSZip();

    Object.keys(obj).forEach((file) => {
        // Get constant info from first appointment
        const date = format(obj[file][0].date, 'ddd Wo MMM YYYY');
        const location = obj[file][0].meeting_point_name;
        const contents = createFinalCSV(date, location, obj[file]);
        zip.file(file, contents);
    });

    // zip.file("Hello.txt", "Hello World\n");
    zip.generateAsync({type:"blob"})
        .then(function(content) {
            const url = window.URL.createObjectURL(content);
            const href = url;
            const target = '_blank';
            const download = 'schedule.zip';

            const resultContainer = document.getElementById('results-link');
            const dlLink = document.createElement('a');

            dlLink.classList.add('download');
            dlLink.setAttribute('href', url);
            dlLink.setAttribute('target', target);
            dlLink.setAttribute('download', download);
            dlLink.innerHTML='Download Schedule';

            resultContainer.appendChild(dlLink);
    });
};

const createFinalCSV = (date, location, obj) => {
    let csv = `${location}\n${date}\n\n${headers}\n`;

    obj.forEach(row => {
        csv += `${row['start_time']}, ${row['end_time']}, ${row['attendee_name']}, ${row['attendee_organisation']}, ${row['booker_name']}, ${row['booker_organisation']}, ${row['meeting_point_name']}, ${row['also_attending']}\n`;
    });

    return csv.replace(/\,\s+$/, '\n');
};

const createDummy = (time, aptLength, location) => {
    return {
        date: time,
        start_time: format(time, 'HH:mm'),
        end_time: format(addMinutes(time, aptLength), 'HH:mm'),
        attendee_name: "Break",
        attendee_organisation: "",
        booker_name: "",
        booker_organisation: "",
        meeting_point_name: location,
        also_attending: "",
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
    ];

    const clean = obj;

    toBeDeleted.forEach( dataKey => delete clean[dataKey] );
    return clean;
};


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
            // console.log('No appointments for ', day);
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
