'use strict';

var AWS = require('aws-sdk');
const uuid = require('uuid');
var PROMISE = require("bluebird");
var json2csv = require('json2csv');
var fs = require('fs');
var ASYNC = require('async');
var xlsx = require('node-xlsx');
const auth0 = require('./func/auth0');
const readline = require('readline');
var _ = require('underscore');

const USERTABLE = 'user';
const LISTINGTABLE = "webscraping-listing";
const TASKTABLE = "webscraping-task";
const SCRAPINGTABLE = "webscraping-scraping";
const COMPANYTABLE = "webscraping-company";

// const USERTABLE = 'user';
// const LISTINGTABLE = "webscraping-listing";
// const TASKTABLE = "task";
// const SCRAPINGTABLE = "scraping";


function validation(event) {
    var response = {};
    var key = 'Error';
    response[key] = [];

    var re = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

    if (event.username === "") {
        response[key].push({
            username: 'Username should not be empty'
        });
    }
    if (event.password === "") {
        response[key].push({
            password: 'Password should not be empty'
        });
    }
    if (event.firstname === "") {
        response[key].push({
            firstname: 'First Name should not be empty'
        });
    }
    if (event.secondname === "") {
        response[key].push({
            secondname: 'Last Name should not be empty'
        });
    }
    if (event.email === "") {
        response[key].push({
            email: 'Email should not be empty'
        });
    } else if (!re.test(event.email)) {
        response[key].push({
            email: 'Email is not valid'
        });
    }
    return response;
}

function sortByKey(array, key) {
    return array.sort(function (a, b) {
        var x = a[key];
        var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

module.exports.register = (event, context, callback) => {

    var postdata = event['body'];

    var response = validation(postdata)

    if (response.Error.length > 0) {
        callback(null, response);
        return;
    }

    var docClient = new AWS.DynamoDB.DocumentClient();

    var params = {
        TableName: USERTABLE
    }

    docClient.scan(params, onScan);

    function onScan(err, itemCollection) {
        if (err) {

            console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));

        } else {

            var totalrecords = itemCollection.Items.length;
            var last_id = 0
            var new_id;
            if (totalrecords > 0) {
                // print all the movies
                console.log("Scanning DONE.");
                var useritems = sortByKey(itemCollection.Items, 'user_id');
                //console.log(useritems);

                var lastitem = useritems.pop()
                last_id = lastitem.user_id
            }
            new_id = last_id + 1


            var item = {
                'user_id': new_id,
            };

            for (var attributename in postdata) {
                if (postdata[attributename].length > 0) {
                    //console.log(attributename+": "+postdata[attributename]);
                    item[attributename] = [];
                    item[attributename] = postdata[attributename]
                }
            }

            //Put Item to DynamoDB
            console.log("Adding a new item...");

            var params = {
                TableName: USERTABLE,
                Item: item
            };

            docClient.put(params, function (err, data) {
                if (err) {
                    console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                    response = {
                        Error: 'Data is not saved successfully'
                    }
                    callback(null, JSON.stringify(response));
                    return;

                } else {
                    console.log("Added item:", JSON.stringify(item, null, 2));
                    response = {
                        status_code: 200,
                        message: 'Data is saved successfully'
                    }
                    callback(null, JSON.stringify(response));
                    return;
                }
            });
        }
    }
};

module.exports.updatePassword = (event, context, callback) => {
    var postdata = event['body'];
    var username = postdata["username"];
    var password = postdata["password"];

    if (username != '' && username != null) {
        var dynamodb = new AWS.DynamoDB();
        var docClient = new AWS.DynamoDB.DocumentClient();

        var params = {
            TableName: USERTABLE,
            FilterExpression: "username = :u",
            ExpressionAttributeValues: {
                ":u": username
            }
        }

        docClient.scan(params, function (err, data) {
            if (err) {
                console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            } else {
                if (data.Items.length > 0) {
                    console.log("Result:", JSON.stringify(data.Items.length, null, 2));
                    var user_id = data.Items[0].user_id;
                    var updateParams = {
                        TableName: USERTABLE,
                        Key: {
                            "user_id": parseInt(user_id)
                        },
                        UpdateExpression: "set #password = :password",
                        ExpressionAttributeValues: {
                            ":password": password
                        },
                        ExpressionAttributeNames: {
                            "#password": "password"
                        },
                        ReturnValues: "UPDATED_NEW"
                    };
                    docClient.update(updateParams, function (err, data) {
                        if (err) {
                            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                            var response = {
                                message: 'Unable to update Password'
                            };

                            callback(null, JSON.stringify(response));
                            return;

                        } else {
                            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                            var response = {
                                status_code: 200,
                                message: 'Password updated successfully'
                            };

                            callback(null, JSON.stringify(response));
                            return;
                        }
                    });
                }
            }
        });
    }
};

function listing_validation(event) {
    var response = {};
    var key = 'Error';
    response[key] = [];

    if (event.url === "") {
        response[key].push({
            url: 'URL should not be empty'
        });
    }
    if (event.date === "") {
        response[key].push({
            date: 'Date should not be empty'
        });
    }
    if (event.listing_status === "") {
        response[key].push({
            listing_status: 'Status should not be empty'
        });
    }
    if (event.listing_level === "") {
        response[key].push({
            listing_level: 'Level should not be empty'
        });
    }
    if (event.listing_template === "") {
        response[key].push({
            listing_template: 'Template should not be empty'
        });
    }
    if (event.category1 === "") {
        response[key].push({
            category1: 'Category 1 should not be empty'
        });
    }
    if (event.category2 === "") {
        response[key].push({
            category2: 'Category 2 should not be empty'
        });
    }
    if (event.category3 === "") {
        response[key].push({
            category3: 'Category 3 should not be empty'
        });
    }
    if (event.category4 === "") {
        response[key].push({
            category4: 'Category 4 should not be empty'
        });
    }
    if (event.category5 === "") {
        response[key].push({
            category5: 'Category 5 should not be empty'
        });
    }
    if (event.keywords === "") {
        response[key].push({
            keywords: 'Keywords should not be empty'
        });
    }
    if (event.short_description === "") {
        response[key].push({
            short_description: 'Short Description should not be empty'
        });
    }
    if (event.long_description === "") {
        response[key].push({
            long_description: 'Long Description should not be empty'
        });
    }
    if (event.listing_keywords === "") {
        response[key].push({
            listing_keywords: 'Listing Keywords should not be empty'
        });
    }
    if (event.facebook === "") {
        response[key].push({
            facebook: 'Facebook should not be empty'
        })
    }
    if (event.twitter === "") {
        response[key].push({
            twitter: 'Twitter should not be empty'
        })
    }
    if (event.instagram === "") {
        response[key].push({
            instagram: 'Instagram should not be empty'
        })
    }
    if (event.linkedin === "") {
        response[key].push({
            linkedin: 'Linkedin should not be empty'
        })
    }
    if (event.companyname === "") {
        response[key].push({
            companyname: 'Companyname should not be empty'
        })
    }
    return response;
}

module.exports.addListing = (event, context, callback) => {

    var postdata = event['body'];

    var response = listing_validation(postdata)

    if (response.Error.length > 0) {
        callback(null, response);
        return;
    }

    var docClient = new AWS.DynamoDB.DocumentClient();

    var params = {
        TableName: LISTINGTABLE
    }

    docClient.scan(params, onScan);

    function onScan(err, itemCollection) {
        if (err) {

            console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));

        } else {

            var totalrecords = itemCollection.Items.length;
            var last_id = 0;
            var new_id;
            if (totalrecords > 0) {
                // print all the movies
                console.log("Scanning DONE.");
                var useritems = sortByKey(itemCollection.Items, 'listing_id');
                //console.log(useritems);

                var lastitem = useritems.pop()
                last_id = lastitem.listing_id
            }

            console.log(postdata.listing_id);

            if (postdata.listing_id !== undefined && postdata.listing_id > 0)
                new_id = postdata.listing_id;
            else
                new_id = uuid.v1();

            console.log(new_id);

            var item = {
                'listing_id': new_id,
            };

            for (var attributename in postdata) {
                if (postdata[attributename].length > 0) {
                    item[attributename] = [];
                    item[attributename] = postdata[attributename]
                }
            }

            //Put Item to DynamoDB
            console.log("Adding a new Listing...");

            var params = {
                TableName: LISTINGTABLE,
                Item: item
            };

            docClient.put(params, function (err, data) {
                if (err) {
                    console.error("Unable to add Listing. Error JSON:", JSON.stringify(err, null, 2));
                    response = {
                        Error: 'Listing is not saved successfully'
                    }
                    callback(null, JSON.stringify(response));
                    return;

                } else {
                    console.log("Added Listing:", JSON.stringify(item, null, 2));
                    response = {
                        status_code: 200,
                        message: 'Listing is saved successfully'
                    }
                    callback(null, JSON.stringify(response));
                    return;
                }
            });
        }
    }
}
module.exports.test = (event, context, callback) => {
    var response = {
        status_code: 200,
        result: event['body']
    }
    callback(null, JSON.stringify(response));
}

module.exports.getlisting = (event, context, callback) => {
    // fetch all task from the database
    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: LISTINGTABLE
    }
    docClient.scan(params, (error, result) => {
        // handle potential errors
        if (error) {
            console.error(error);
            callback(null, {
                statusCode: error.statusCode || 501,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Couldn\'t fetch the task.',
            });
            return;
        }

        // create a response
        const response = {
            statusCode: 200,
            body: result.Items,
        };
        callback(null, response);
    });
};

module.exports.getScraping = (event, context, callback) => {
    // fetch all task from the database
    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: SCRAPINGTABLE
    }
    docClient.scan(params, (error, result) => {
        // handle potential errors
        if (error) {
            console.error(error);
            callback(null, {
                statusCode: error.statusCode || 501,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Couldn\'t fetch the task.',
            });
            return;
        }

        var companynames = [];
        for (var key in result.Items) {
            if (companynames.indexOf(result.Items[key].companyname) < 0) {
                companynames.push(result.Items[key].companyname);
            }
        }

        result.Items = _.sortBy(result.Items, 'createdAt');
        var companyData = {};
        var items = [];
        companynames.forEach(function (key) {
            var scrapObj = {};
            result.Items.forEach(function (row) {
                if (row.companyname === key) {
                    scrapObj = row;
                }
            });
            items.push(scrapObj);
        });


        // create a response
        const response = {
            statusCode: 200,
            body: items,
        };
        callback(null, response);
    });
};

module.exports.list = (event, context, callback) => {
    // fetch all task from the database
    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: TASKTABLE
    }
    docClient.scan(params, (error, result) => {
        // handle potential errors
        if (error) {
            console.error(error);
            callback(null, {
                statusCode: error.statusCode || 501,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Couldn\'t fetch the task.',
            });
            return;
        }

        // create a response
        const response = {
            statusCode: 200,
            body: result.Items,
        };
        callback(null, response);
    });
};


module.exports.create = (event, context, callback) => {
    console.log(event);
    const timestamp = new Date().getTime();
    const data = event.body;
    console.log(data);
    if (typeof data.name !== 'string') {
        console.error('Validation Failed');
        callback(null, {
            statusCode: 400,
            headers: {
                'Content-Type': 'text/plain'
            },
            body: 'Couldn\'t create the task item.',
        });
        return;
    }

    var docClient = new AWS.DynamoDB.DocumentClient();

    const params = {
        TableName: TASKTABLE,
        Item: {
            id: uuid.v1(),
            name: data.name,
            companyname: data.companyname,
            priority: data.priority,
            tstatus: data.tstatus,
            createdAt: timestamp,
            updatedAt: timestamp,
        },
    };

    // write the todo to the database
    docClient.put(params, (error) => {
        // handle potential errors
        if (error) {
            console.error(error);
            callback(null, {
                statusCode: error.statusCode || 501,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Couldn\'t create the task item.',
            });
            return;
        }

        // create a response
        const response = {
            statusCode: 200,
            body: JSON.stringify(params.Item),
        };
        callback(null, response);
    });
};

module.exports.update = (event, context, callback) => {
    const timestamp = new Date().getTime();
    console.log(event);
    const data = event.body;

    // validation
    if (typeof data.name !== 'string') {
        console.error('Validation Failed');
        callback(null, {
            statusCode: 400,
            headers: {
                'Content-Type': 'text/plain'
            },
            body: 'Couldn\'t update the task item.',
        });
        return;
    }

    var docClient = new AWS.DynamoDB.DocumentClient();

    const params = {
        TableName: TASKTABLE,
        Key: {
            id: event.path.id,
        },
        ExpressionAttributeNames: {
            '#todo_name': 'name',
        },
        ExpressionAttributeValues: {
            ':name': data.name,
            ':companyname': data.companyname,
            ':tstatus': data.tstatus,
            ':priority': data.priority,
            ':updatedAt': timestamp,
        },
        UpdateExpression: 'SET #todo_name = :name, companyname = :companyname,tstatus = :tstatus, priority = :priority, updatedAt = :updatedAt',
        ReturnValues: 'ALL_NEW',
    };

    // update the todo in the database
    docClient.update(params, (error, result) => {
        // handle potential errors
        if (error) {
            console.error(error);
            callback(null, {
                statusCode: error.statusCode || 501,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Couldn\'t fetch the task item.',
            });
            return;
        }

        // create a response
        const response = {
            statusCode: 200,
            body: JSON.stringify(result.Attributes),
        };
        callback(null, response);
    });
};


module.exports.delete = (event, context, callback) => {
    console.log(event);
    const params = {
        TableName: TASKTABLE,
        Key: {
            id: event.path.id,
        },
    };
    var docClient = new AWS.DynamoDB.DocumentClient();
    // delete the todo from the database
    docClient.delete(params, (error) => {
        // handle potential errors
        if (error) {
            console.error(error);
            callback(null, {
                statusCode: error.statusCode || 501,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Couldn\'t remove the task item.',
            });
            return;
        }

        // create a response
        const response = {
            statusCode: 200,
            body: JSON.stringify({}),
        };
        callback(null, response);
    });
};


module.exports.singlePageScraping = (event, context, callback) => {
    console.log(event);
    callback(null, event);
};

module.exports.saveScraping = (event, context, callback) => {
    console.log(event);
    console.log(event['body']);
    const timestamp = new Date().getTime();
    const data = event['body'];

    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: SCRAPINGTABLE,
        Item: {
            id: uuid.v1(),
            //id: data.id === undefined ? uuid.v1() : data.id,
            site_name: data.site_name,
            companyEmail: data.companyEmail,
            storeURL: data.storeURL,
            template: data.template,
            companyname: data.companyname,
            site_url: data.site_url,
            address: data.address,
            address2: data.address2,
            country: data.country,
            state: data.state,
            city: data.city,
            postcode: data.postcode,
            latitude: data.latitude,
            longtude: data.longtude,
            phone: data.phone,
            storehours: data.storehours,
            container: data.container,
            selector: data.selector,
            createdAt: timestamp,
        },
    };

    if (data.id === undefined || data.id === '' || data.id === null) {
        params.Item.changeStatus = 'NEW';
        //console.log('1', data.id);
    } else {
        console.log('2', data.id);
        //params.Item.id = data.id;
        params.Item.changeStatus = 'MODIFIED';
    }

    // write the todo to the database
    docClient.put(params, (error) => {
        // handle potential errors
        if (error) {
            console.error(error);
            callback({
                statusCode: error.statusCode || 501,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Couldn\'t create the scrap item.',
            }, null);
            return;
        }

        // create a response
        const response = {
            statusCode: 200,
            body: params.Item,
        };
        callback(null, response);
    });
};


module.exports.uploadListing = (event, context, callback) => {
    var postdata = event['body'];
    var docClient = new AWS.DynamoDB.DocumentClient();
    var s3bucket = new AWS.S3();
    var params = {
        TableName: LISTINGTABLE
    }
    var paramsScrap = {
        TableName: SCRAPINGTABLE
    }
    var response;

    docClient.scan(params, onScan);

    function onScan(err, itemCollection) {
        if (err) {
            console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));

        } else {
            var totalrecords = itemCollection.Items.length;
            if (totalrecords > 0) {
                console.log("Scanning DONE.");

                docClient.scan(paramsScrap, onScan);

                function onScan(err, scrapItemCollection) {
                    if (err) {
                        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
                    } else {
                        var fieldNames = [
                            'Listing Title (Required)',
                            'Listing SEO Title',
                            'Listing Email',
                            'Listing URL',
                            'Listing Address',
                            'Listing Address2',
                            'Listing Country',
                            'Listing Country Abbreviation',
                            'Listing Region',
                            'Listing Region Abbreviation',
                            'Listing State',
                            'Listing State Abbreviation',
                            'Listing City',
                            'Listing City Abbreviation',
                            'Listing Neighborhood',
                            'Listing Neighborhood Abbreviation',
                            'Listing Postal Code',
                            'Listing Latitude',
                            'Listing Longitude',
                            'Listing Phone',
                            'Listing Fax',
                            'Listing Short Description',
                            'Listing Long Description',
                            'Listing SEO Description',
                            'Listing Keywords',
                            'Listing Renewal Date',
                            'Listing Status',
                            'Listing Level',
                            'Listing Category 1',
                            'Listing Category 2',
                            'Listing Category 3',
                            'Listing Category 4',
                            'Listing Category 5',
                            'Listing Template',
                            'Listing DB Id',
                            'Custom ID',
                            'Account Username',
                            'Account Password',
                            'Account Contact First Name',
                            'Account Contact Last Name',
                            'Account Contact Company',
                            'Account Contact Address',
                            'Account Contact Address2',
                            'Account Contact Country',
                            'Account Contact State',
                            'Account Contact City',
                            'Account Contact Postal Code',
                            'Account Contact Phone',
                            'Account Contact Fax',
                            'Account Contact Email',
                            'Account Contact URL',
                            'Listing Facebook',
                            'Listing Twitter',
                            'Listing Instagram',
                            'Listing Linkedin'
                        ];

                        var fields = [
                            'ListingTitle',
                            'ListingSEOTitle',
                            'ListingEmail',
                            'ListingURL',
                            'ListingAddress',
                            'ListingAddress2',
                            'ListingCountry',
                            'ListingCountryAbbreviation',
                            'ListingRegion',
                            'ListingRegionAbbreviation',
                            'ListingState',
                            'ListingStateAbbreviation',
                            'ListingCity',
                            'ListingCityAbbreviation',
                            'ListingNeighborhood',
                            'ListingNeighborhoodAbbreviation',
                            'ListingPostCode',
                            'ListingLatitude',
                            'ListingLongitude',
                            'ListingPhone',
                            'ListingFax',
                            'ListingShortDescription',
                            'ListingLongDescription',
                            'ListingSEODescription',
                            'ListingKeywords',
                            'ListingRenewalDate',
                            'ListingStatus',
                            'ListingLevel',
                            'ListingCategory1',
                            'ListingCategory2',
                            'ListingCategory3',
                            'ListingCategory4',
                            'ListingCategory5',
                            'ListingTemplate',
                            'ListingDBId',
                            'CustomID',
                            'AccountUsername',
                            'AccountPassword',
                            'AccountContactFirstName',
                            'AccountContactLastName',
                            'AccountContactCompany',
                            'AccountContactAddress',
                            'AccountContactAddress2',
                            'AccountContactCountry',
                            'AccountContactState',
                            'AccountContactCity',
                            'AccountContactPostalCode',
                            'AccountContactPhone',
                            'AccountContactFax',
                            'AccountContactEmail',
                            'AccountContactURL',
                            'ListingFacebook',
                            'ListingTwitter',
                            'ListingInstagram',
                            'ListingLinkedin',
                            // 'listing_keywords', 
                            // 'ListingSiteName', 
                            // 'ListingStoreURL', 
                            // 'Template', 
                            // 'ListingSiteURL'
                        ];

                        // for (var key in itemCollection.Items[0]) {
                        //     var field = fieldsMaping(key);
                        //     if (key !== "listing_id")
                        //         fields.push(field);
                        // }
                        // for (var key in scrapItemCollection.Items[0]) {
                        //     var field = fieldsMaping(key);
                        //     if (key !== "id" && key !== "createdAt" && key !== "updatedAt" && key !== "companyname")
                        //         fields.push(field);
                        // }

                        var companynames = [];
                        for (var key in itemCollection.Items) {
                            if (companynames.indexOf(itemCollection.Items[key].companyname) < 0) {
                                companynames.push(itemCollection.Items[key].companyname);
                            }
                        }

                        var companyData = {};
                        companynames.forEach(function (key) {
                            companyData[key] = new Array();
                            var scrapObj = {};
                            scrapItemCollection.Items.forEach(function (row) {
                                if (row.companyname === key) {
                                    scrapObj = row;
                                }
                            });

                            itemCollection.Items.forEach(function (rowt) {
                                if (rowt.companyname === key) {
                                    var row = {};
                                    //row.CompanyName = rowt.companyname;
                                    row.ListingTitle = '';
                                    row.ListingSEOTitle = '';
                                    row.ListingEmail = '';
                                    row.ListingURL = rowt.url;
                                    row.ListingAddress = scrapObj.address;
                                    row.ListingAddress2 = scrapObj.address2;
                                    row.ListingCountry = scrapObj.country;
                                    row.ListingCountryAbbreviation = '';
                                    row.ListingState = scrapObj.state;
                                    row.ListingStateAbbreviation = '';
                                    row.ListingCity = scrapObj.city;
                                    row.ListingRegionAbbreviation = '';
                                    row.ListingPostCode = scrapObj.postcode;
                                    row.ListingLatitude = scrapObj.latitude;
                                    row.ListingLongitude = scrapObj.longtude;
                                    row.ListingPhone = scrapObj.phone;
                                    row.ListingRenewalDate = rowt.date;
                                    row.ListingStatus = rowt.listing_status;
                                    row.ListingLevel = rowt.listing_level;
                                    row.ListingTemplate = rowt.listing_template;
                                    row.ListingCategory1 = rowt.category1;
                                    row.ListingCategory2 = rowt.category2;
                                    row.ListingCategory3 = rowt.category3;
                                    row.ListingCategory4 = rowt.category4;
                                    row.ListingCategory5 = rowt.category5;
                                    row.ListingKeywords = rowt.keywords;
                                    row.ListingShortDescription = rowt.short_description;
                                    row.ListingLongDescription = rowt.long_description;
                                    row.listing_keywords = rowt.listing_keywords;
                                    row.ListingFacebook = rowt.facebook;
                                    row.ListingTwitter = rowt.twitter;
                                    row.ListingInstagram = rowt.instagram;
                                    row.ListingLinkedin = rowt.linkedin;
                                    row.ListingSiteName = scrapObj.site_name;
                                    row.ListingStoreURL = scrapObj.storeURL;
                                    row.Template = scrapObj.template;
                                    row.ListingSiteURL = scrapObj.site_url;
                                    row.ListingAddress = scrapObj.address;
                                    row.ListingAddress2 = scrapObj.address2;
                                    row.ListingCountry = scrapObj.country;
                                    row.ListingState = scrapObj.state;
                                    row.ListingCity = scrapObj.city;
                                    row.ListingPostCode = scrapObj.postcode;
                                    row.ListingLatitude = scrapObj.latitude;
                                    row.ListingLongitude = scrapObj.longtude;
                                    row.ListingPhone = scrapObj.phone;
                                    companyData[key].push(row);
                                }
                            });
                        }, this);

                        console.log(companynames);


                        ASYNC.map(companynames, function (company, callback) {
                            var cData = companyData[company];
                            console.log(cData);
                            var csv = json2csv({
                                data: cData,
                                fields: fields,
                                fieldNames: fieldNames
                            });

                            var param = {
                                Bucket: 'store-locations',
                                Key: company + '.csv',
                                Body: csv
                            };

                            s3bucket.putObject(param, function (err, data) {
                                if (err) {
                                    console.error("Unable to upload Listing. Error JSON:", JSON.stringify(err, null, 2));
                                    response = {
                                        Error: 'Listing is not upload successfully'
                                    }
                                    callback(null, JSON.stringify(response));

                                } else {
                                    console.log("upload Listing:", JSON.stringify(data, null, 2));
                                    response = {
                                        status_code: 200,
                                        message: 'Listing is uploaded successfully'
                                    }
                                    callback(null, JSON.stringify(response));
                                }
                            });
                        }, function (err, payload) {
                            if (err) {
                                console.log(err);
                                callback(null, err);
                                return;
                            } else {
                                console.log(payload);
                                callback(null, payload);
                                return;
                            }
                        });
                    }
                }
            } else {
                response = {
                    status_code: 200,
                    message: 'There is no listing available.'
                }
                callback(null, JSON.stringify(response));
                return;
            }
        }
    }
}

module.exports.uploadScrapingJob = (event, context, callback) => {
    var postdata = event['body'];
    var docClient = new AWS.DynamoDB.DocumentClient();
    var s3bucket = new AWS.S3();
    var params = {
        TableName: SCRAPINGTABLE
    }
    var response;

    docClient.scan(params, onScan);

    function onScan(err, itemCollection) {
        if (err) {
            console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));

        } else {
            var totalrecords = itemCollection.Items.length;
            if (totalrecords > 0) {
                console.log("Scanning DONE.");

                var fields = ['site_name', 'storeURL', 'companyname', 'template', 'site_url',
                    'address', 'address2', 'country', 'state', 'city', 'postcode', 'latitude',
                    'longtude', 'phone', 'changeStatus',
                    'psite_name', 'pstoreURL', 'pcompanyname', 'ptemplate', 'psite_url',
                    'paddress', 'paddress2', 'pcountry', 'pstate', 'pcity', 'ppostcode', 'platitude',
                    'plongtude', 'pphone'
                ];

                var results = [];
                itemCollection.Items.forEach(function (element) {
                    var res = {};
                    res.site_name = element.site_name;
                    res.storeURL = element.storeURL;
                    res.companyname = element.companyname;
                    res.template = element.template;
                    res.site_url = element.site_url;
                    res.address = element.address;
                    res.address2 = element.address2;
                    res.country = element.country;
                    res.state = element.state;
                    res.city = element.city;
                    res.postcode = element.postcode;
                    res.latitude = element.latitude;
                    res.longtude = element.longtude;
                    res.phone = element.phone;
                    res.changeStatus = element.changeStatus;
                    results.push(res);
                }, this);

                var companynames = [];
                for (var key in results) {
                    if (companynames.indexOf(results[key].companyname) < 0) {
                        companynames.push(results[key].companyname);
                    }
                }

                var companyData = {};
                var items = [];
                companynames.forEach(function (key) {
                    var scrapObj = {};
                    var lastScrapObj = {};
                    results.forEach(function (row) {
                        if (row.companyname === key) {
                            lastScrapObj = scrapObj;
                            scrapObj = row;
                        }
                    });
                    if (lastScrapObj.companyname !== '') {
                        scrapObj.psite_name = lastScrapObj.site_name;
                        scrapObj.pstoreURL = lastScrapObj.storeURL;
                        scrapObj.pcompanyname = lastScrapObj.companyname;
                        scrapObj.ptemplate = lastScrapObj.template;
                        scrapObj.psite_url = lastScrapObj.site_url;
                        scrapObj.paddress = lastScrapObj.address;
                        scrapObj.paddress2 = lastScrapObj.address2;
                        scrapObj.pcountry = lastScrapObj.country;
                        scrapObj.pstate = lastScrapObj.state;
                        scrapObj.pcity = lastScrapObj.city;
                        scrapObj.ppostcode = lastScrapObj.postcode;
                        scrapObj.platitude = lastScrapObj.latitude;
                        scrapObj.plongtude = lastScrapObj.longtude;
                        scrapObj.pphone = lastScrapObj.phone;
                    }
                    items.push(scrapObj);
                });

                var fieldNames = ['Site Name', 'Store URL', 'Company Name', 'Scraping Template', 'Site URL', 'Address', 'Address 2', 'Country', 'State', 'City', 'PostCode', 'Latitude', 'Longitude', 'Phone', 'Status', 'Site Name', 'Store URL', 'Company Name', 'Scraping Template', 'Site URL', 'Address', 'Address 2', 'Country', 'State', 'City', 'PostCode', 'Latitude', 'Longitude', 'Phone'];
                var csv = json2csv({
                    data: items,
                    fields: fields,
                    fieldNames: fieldNames
                });
                const datetime = new Date();

                var param = {
                    Bucket: 'reports-changes',
                    Key: 'Report' + datetime.getDate() + datetime.getMonth() + datetime.getFullYear() + '.csv',
                    Body: csv
                };

                s3bucket.putObject(param, function (err, data) {
                    if (err) {
                        console.error("Unable to upload Listing. Error JSON:", JSON.stringify(err, null, 2));
                        response = {
                            Error: 'Scraping job is not upload successfully'
                        }
                        callback(null, JSON.stringify(response));
                        return;
                    } else {
                        console.log("upload Listing:", JSON.stringify(data, null, 2));
                        response = {
                            status_code: 200,
                            message: 'Scraping is uploaded successfully'
                        }
                        callback(null, JSON.stringify(response));
                        return;
                    }
                });

            } else {
                response = {
                    status_code: 200,
                    message: 'There is no listing available.'
                }
                callback(null, JSON.stringify(response));
                return;
            }
        }
    }
}

module.exports.getScrapingById = (event, context, callback) => {
    // fetch all task from the database
    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: SCRAPINGTABLE,
        KeyConditionExpression: "#lid = :kId",
        ExpressionAttributeNames: {
            "#lid": "id"
        },
        ExpressionAttributeValues: {
            ":kId": event.path.id
        }
    }
    docClient.query(params, (error, result) => {
        // handle potential errors
        if (error) {
            console.error(error);
            callback(null, {
                statusCode: error.statusCode || 501,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Couldn\'t fetch the task.',
            });
            return;
        }

        // create a response
        const response = {
            statusCode: 200,
            body: result.Items,
        };
        callback(null, response);
    });
};

module.exports.getLastScrapingById = (event, context, callback) => {
    // fetch all task from the database
    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: SCRAPINGTABLE
    }
    docClient.scan(params, (error, result) => {
        // handle potential errors
        if (error) {
            console.error(error);
            callback(null, {
                statusCode: error.statusCode || 501,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Couldn\'t fetch the task.',
            });
            return;
        }

        var companynames = [];
        var company = '';
        for (var key in result.Items) {
            if (companynames.indexOf(result.Items[key].companyname) < 0) {
                companynames.push(result.Items[key].companyname);
            }
            if (event.path.id == result.Items[key].id) {
                company = result.Items[key].companyname;
            }
        }

        result.Items = _.sortBy(result.Items, 'createdAt');
        var companyData = {};
        var scrapObj = {};
        companynames.forEach(function (key) {
            if (key == company) {
                result.Items.forEach(function (row) {
                    if (row.companyname === key && row.id !== event.path.id) {
                        scrapObj = row;
                    }
                });
            }
        });


        // create a response
        const response = {
            statusCode: 200,
            body: [scrapObj],
        };
        callback(null, response);
    });
};


module.exports.deleteScraping = (event, context, callback) => {
    console.log(event);
    const params = {
        TableName: SCRAPINGTABLE,
        Key: {
            id: event.path.id,
        },
    };
    var docClient = new AWS.DynamoDB.DocumentClient();
    // delete the todo from the database
    docClient.delete(params, (error) => {
        // handle potential errors
        if (error) {
            console.error(error);
            callback(null, {
                statusCode: error.statusCode || 501,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Couldn\'t remove the task item.',
            });
            return;
        }

        // create a response
        const response = {
            statusCode: 200,
            body: JSON.stringify({}),
        };
        callback(null, response);
    });
};

module.exports.getListingById = (event, context, callback) => {
    // fetch all task from the database
    var docClient = new AWS.DynamoDB.DocumentClient();
    console.log(event);
    var params = {
        TableName: LISTINGTABLE,
        KeyConditionExpression: "#lid = :id",
        ExpressionAttributeNames: {
            "#lid": "listing_id"
        },
        ExpressionAttributeValues: {
            ":id": event.path.id
        }
    }
    console.log(params);

    docClient.query(params, (error, result) => {
        // handle potential errors
        if (error) {
            console.error(error);
            callback(null, {
                statusCode: error.statusCode || 501,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Couldn\'t fetch the task.',
            });
            return;
        }
        console.log(result.Items);
        // create a response
        const response = {
            statusCode: 200,
            body: result.Items,
        };
        callback(null, response);
    });
};

module.exports.deleteListing = (event, context, callback) => {
    console.log(event);
    const params = {
        TableName: LISTINGTABLE,
        Key: {
            listing_id: event.path.id,
        },
    };
    console.log(params)
    var docClient = new AWS.DynamoDB.DocumentClient();
    // delete the todo from the database
    docClient.delete(params, (error) => {
        // handle potential errors
        if (error) {
            console.error(error);
            callback(null, {
                statusCode: error.statusCode || 501,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Couldn\'t remove the task item.',
            });
            return;
        }

        // create a response
        const response = {
            statusCode: 200,
            body: JSON.stringify({}),
        };
        callback(null, response);
    });
};


module.exports.testScraping = (event, context, callback) => {
    var data = event['body'];
    console.log(event);
    console.log(data);

    var lambda = new AWS.Lambda();
    //Promisfy all method of lambda object with suffix Promisified
    PROMISE.promisifyAll(Object.getPrototypeOf(lambda), {
        suffix: "Promisified"
    });

    if (data.template === 'Single Page') {

        data.url = data.site_url[0];
        var params = {
            FunctionName: 'SinglePage',
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(data, null, 2)
        };
        var resData = lambda.invokePromisified(params).then(function (response) {
            callback(null, response);
        }, function (err) {
            callback(err, null);
        });

    } else if (data.template === 'Singe Page with Pagination') {

    } else if (data.template === 'Multiple Page') {

    } else if (data.template === 'Multi Page with Location  Search') {

    }

};


module.exports.processBulkTask = (event, context, callback) => {
    var postdata = event['body'];
    console.log(event);
    console.log(postdata);
    var docClient = new AWS.DynamoDB.DocumentClient();
    var s3bucket = new AWS.S3();
    const datetime = new Date();
    var lineNumber = 0;
    const timestamp = new Date().getTime();

    var param = {
        Bucket: 'bulktask-files',
        Key: postdata.FileName
    };

    var file = s3bucket.getObject(param).createReadStream();
    var buffers = [];

    file.on('data', function (data) {
        buffers.push(data);
    });

    file.on('end', function () {
        var buffer = Buffer.concat(buffers);
        var workbook = xlsx.parse(buffer);
        console.log("workbook", workbook)
        var data = workbook[0].data;
        for (var i = 0; i < data.length; i++) {
            if (i > 0) {
                const params = {
                    TableName: TASKTABLE,
                    Item: {
                        id: uuid.v1(),
                        name: data[i][0],
                        companyname: data[i][1],
                        priority: data[i][2],
                        tstatus: data[i][3],
                        createdAt: timestamp,
                        updatedAt: timestamp,
                    },
                };
                console.log('+ ', data[i]);
                console.log('++ ', params);
                // write the todo to the database
                docClient.put(params, (error) => {
                    // handle potential errors
                    if (error) {
                        console.error(error);
                        callback(null, {
                            statusCode: error.statusCode || 501,
                            headers: {
                                'Content-Type': 'text/plain'
                            },
                            body: 'Couldn\'t create the task item.',
                        });
                        return;
                    }

                    // create a response
                    const response = {
                        statusCode: 200,
                        body: JSON.stringify(params.Item),
                    };
                    callback(null, response);
                });
            }
        }

    });



}

module.exports.processBulkListing = (event, context, callback) => {
    var postdata = event['body'];
    console.log(event);
    console.log(postdata);
    var docClient = new AWS.DynamoDB.DocumentClient();
    var s3bucket = new AWS.S3();
    const datetime = new Date();
    var lineNumber = 0;
    const timestamp = new Date().getTime();

    var param = {
        Bucket: 'bulktask-files',
        Key: postdata.FileName
    };

    var file = s3bucket.getObject(param).createReadStream();
    var buffers = [];

    file.on('data', function (data) {
        buffers.push(data);
    });

    file.on('end', function () {
        var buffer = Buffer.concat(buffers);
        var workbook = xlsx.parse(buffer);
        console.log("workbook", workbook)
        var data = workbook[0].data;
        for (var i = 0; i < data.length; i++) {
            if (i > 0) {
                const params = {
                    TableName: LISTINGTABLE,
                    Item: {
                        listing_id: uuid.v1(),
                        url: data[i][0],
                        date: data[i][1],
                        companyname: data[i][2],
                        listing_level: data[i][3],
                        listing_status: data[i][4],
                        listing_template: data[i][5],
                        category1: data[i][6],
                        category2: data[i][7],
                        category3: data[i][8],
                        category4: data[i][9],
                        category5: data[i][10],
                        keywords: data[i][11],
                        short_description: data[i][12],
                        long_description: data[i][13],
                        listing_keywords: data[i][14],
                        facebook: data[i][15],
                        twitter: data[i][16],
                        instagram: data[i][17],
                        linkedin: data[i][18],
                        createdAt: timestamp,
                        updatedAt: timestamp,
                    },
                };
                console.log('+ ', data[i]);
                console.log('++ ', params);
                // write the todo to the database
                docClient.put(params, (error) => {
                    // handle potential errors
                    if (error) {
                        console.error(error);
                        callback(null, {
                            statusCode: error.statusCode || 501,
                            headers: {
                                'Content-Type': 'text/plain'
                            },
                            body: 'Couldn\'t create the task item.',
                        });
                        return;
                    }

                    // create a response
                    const response = {
                        statusCode: 200,
                        body: JSON.stringify(params.Item),
                    };
                    callback(null, response);
                });
            }
        }

    });



}


module.exports.processBulkScraping = (event, context, callback) => {
    var postdata = event['body'];
    console.log(event);
    console.log(postdata);
    var docClient = new AWS.DynamoDB.DocumentClient();
    var s3bucket = new AWS.S3();
    const datetime = new Date();
    var lineNumber = 0;
    const timestamp = new Date().getTime();

    var param = {
        Bucket: 'bulktask-files',
        Key: postdata.FileName
    };

    var file = s3bucket.getObject(param).createReadStream();
    var buffers = [];

    file.on('data', function (data) {
        buffers.push(data);
    });

    file.on('end', function () {
        var buffer = Buffer.concat(buffers);
        var workbook = xlsx.parse(buffer);
        console.log("workbook", workbook)
        var data = workbook[0].data;
        for (var i = 0; i < data.length; i++) {
            if (i > 0) {
                const params = {
                    TableName: SCRAPINGTABLE,
                    Item: {
                        id: uuid.v1(),
                        site_name: data[i][0],
                        storeURL: data[i][1],
                        template: data[i][3],
                        companyname: data[i][2],
                        site_url: data[i][4],
                        address: data[i][5],
                        address2: data[i][6],
                        country: data[i][7],
                        state: data[i][8],
                        city: data[i][9],
                        postcode: data[i][10],
                        latitude: data[i][11],
                        longtude: data[i][12],
                        phone: data[i][13],
                        createdAt: timestamp,
                    },
                };
                console.log('+ ', data[i]);
                console.log('++ ', params);
                // write the todo to the database
                docClient.put(params, (error) => {
                    // handle potential errors
                    if (error) {
                        console.error(error);
                        callback(null, {
                            statusCode: error.statusCode || 501,
                            headers: {
                                'Content-Type': 'text/plain'
                            },
                            body: 'Couldn\'t create the task item.',
                        });
                        return;
                    }

                    // create a response
                    const response = {
                        statusCode: 200,
                        body: JSON.stringify(params.Item),
                    };
                    callback(null, response);
                });
            }
        }

    });

}

module.exports.saveCompany = (event, context, callback) => {
    console.log(event);
    console.log(event['body']);
    const timestamp = new Date().getTime();
    const data = event['body'];

    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: COMPANYTABLE,
        Item: {
            //id: uuid.v1(),
            id: data.id === undefined ? uuid.v1() : data.id,
            companyEmail: data.companyEmail,
            companyname: data.companyname,
            createdAt: timestamp,
        },
    };

    // write the todo to the database
    docClient.put(params, (error) => {
        // handle potential errors
        if (error) {
            console.error(error);
            callback({
                statusCode: error.statusCode || 501,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Couldn\'t create the scrap item.',
            }, null);
            return;
        }

        // create a response
        const response = {
            statusCode: 200,
            body: params.Item,
        };
        callback(null, response);
    });
};

module.exports.deleteCompany = (event, context, callback) => {
    console.log(event);
    const params = {
        TableName: COMPANYTABLE,
        Key: {
            id: event.path.id,
        },
    };
    var docClient = new AWS.DynamoDB.DocumentClient();
    // delete the todo from the database
    docClient.delete(params, (error) => {
        // handle potential errors
        if (error) {
            console.error(error);
            callback(null, {
                statusCode: error.statusCode || 501,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Couldn\'t remove the task item.',
            });
            return;
        }

        // create a response
        const response = {
            statusCode: 200,
            body: JSON.stringify({}),
        };
        callback(null, response);
    });
};

module.exports.companyList = (event, context, callback) => {
    // fetch all task from the database
    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: COMPANYTABLE
    }
    docClient.scan(params, (error, result) => {
        // handle potential errors
        if (error) {
            console.error(error);
            callback(null, {
                statusCode: error.statusCode || 501,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Couldn\'t fetch the task.',
            });
            return;
        }

        // create a response
        const response = {
            statusCode: 200,
            body: result.Items,
        };
        callback(null, response);
    });
};

module.exports.getCompanyById = (event, context, callback) => {
    // fetch all task from the database
    console.log(event);
    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: COMPANYTABLE,
        KeyConditionExpression: "#lid = :kId",
        ExpressionAttributeNames: {
            "#lid": "id"
        },
        ExpressionAttributeValues: {
            ":kId": event.path.id
        }
    }
    docClient.query(params, (error, result) => {
        // handle potential errors
        if (error) {
            console.error(error);
            callback({
                statusCode: error.statusCode || 501,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Couldn\'t fetch the task.',
            },null);
            return;
        }

        // create a response
        const response = {
            statusCode: 200,
            body: result.Items,
        };
        callback(null, response);
    });
};


module.exports.getCompanyTimeline = (event, context, callback) => {
    // fetch all task from the database
    console.log(event['body']);
    const data = event['body'];
    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: SCRAPINGTABLE
    }
    docClient.scan(params, (error, result) => {
        // handle potential errors
        if (error) {
            console.error(error);
            callback({
                statusCode: error.statusCode || 501,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: 'Couldn\'t fetch the task.',
            },null);
            return;
        }
        
        result.Items = _.sortBy(result.Items, 'createdAt');
        result.Items = result.Items.reverse();

        var companynames = [];
        for (var key in result.Items) {
            if (result.Items[key].companyname == data.companyname ) {
                companynames.push(result.Items[key]);
            }
        }

        
        // create a response
        const response = {
            statusCode: 200,
            body: companynames,
        };
        callback(null, response);
    });
};