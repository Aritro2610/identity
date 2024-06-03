import { PrismaClient } from '@prisma/client'
import express, { Request, Response } from "express";

const prisma = new PrismaClient()

const getIdentify = async(req:Request, res:Response) => { // GET endpoint to retrieve data as per mentioned in pdf
    try {
        const { phoneNumber, email } = req.body;
        // console.log("first")
        const searchCondition = [];
        if (phoneNumber) searchCondition.push({ phoneNumber });
        if (email) searchCondition.push({ email });
        // console.log("searchCondition", searchCondition);
        let primaryContact = await prisma.contact.findFirst({ // returnes the first row based on search condition
            where: {
                AND: searchCondition,
                // linkPrecedence: 'primary'
            }
        });
        console.log(primaryContact);
        if (!primaryContact) {
            const secondaryContact = await prisma.contact.findFirst({
                where: {
                    AND: searchCondition,
                    linkPrecedence: 'secondary'
                }
            });
            console.log("secondary",secondaryContact)
            if (secondaryContact) {
                // const secondaryContactId = secondaryContact?.linkedId;
                console.log(secondaryContact.linkedId);
                primaryContact = await prisma.contact.findFirst({
                    where: {
                        id: secondaryContact.linkedId ? secondaryContact.linkedId : 0
                    }
                }); 
            }
        }
        if (!primaryContact) {
            return res.status(404).json({ message: "Contact not found." });
        }
        const secondaryContact = await prisma.contact.findMany({
            where: {
                linkedId: primaryContact?.id
            }
        })
        // let primaryContact;
        const emails = new Set(); // used set to prevent duplicate 
        const phoneNumbers = new Set(); // used set to prevent duplicate
        const secondaryContactIds = [];
        if (primaryContact?.email) {
            emails.add(primaryContact.email);
        }
        if (primaryContact?.phoneNumber) {
            phoneNumbers.add(primaryContact.phoneNumber);
        }
        for (let i = 0; i < secondaryContact.length; i++){
            emails.add(secondaryContact[i].email);
            phoneNumbers.add(secondaryContact[i].phoneNumber);
            secondaryContactIds.push(secondaryContact[i].id);
        }
        const data = {
            contact: {
                primaryContactId: primaryContact?.id,
                emails: Array.from(emails),
                phoneNumbers: Array.from(phoneNumbers),
                secondaryContactIds: Array.from(secondaryContactIds)
            }
        }
        // console.log(contact);

        return res.status(200).json({
            success: true,
            message: "Fetched data",
            data
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            error: error
        })
    }
}
const deleteIdentify = async(req:Request, res:Response) => { // deleting a data
    try {
        const { id } = req.body;
        console.log("delete")
        await prisma.contact.delete({where: {
            id
          }})
        // console.log(contact);

        return res.status(200).json({
            success: true,
            message: "Deleted data"
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            error: error
        })
    }
}
const postIdentify = async(req:Request, res:Response) => { // endpoint to create primary and secondary based on existing data check 
    try {
        const { phoneNumber, email } = req.body;
        const searchCondition = [];
        if (phoneNumber) searchCondition.push({ phoneNumber });
        if (email) searchCondition.push({ email });
        let primaryContact = await prisma.contact.findFirst({where: { // returnes the first row based on search condition
            OR: searchCondition
        }
        })
  
        const date = new Date();

        let contact; 

        if (primaryContact) { // if row present creating a secondary ID
            contact = await prisma.contact.create({
                    data: {
                    phoneNumber,
                    email,
                    linkedId: primaryContact.linkPrecedence === "secondary" ? primaryContact.linkedId : primaryContact.id,
                    linkPrecedence: "secondary",
                    updatedAt: date
                },
            })

            console.log(contact);
        } else { // if row present creating a new data
            primaryContact = await prisma.contact.create({
                    data: {
                    phoneNumber,
                    email,
                    linkPrecedence: "primary",
                    updatedAt:date
                },
            })
            console.log("existing contact did not found. New contact created",primaryContact)
        }
        const secondaryContact = primaryContact.linkedId !== null ? await prisma.contact.findMany({
            where: {
                AND: [{linkedId: primaryContact.linkedId},{linkPrecedence: 'secondary'}]
            }
        }) : []; // fetching secondary contact conditional if new primary contact created then [] else data 
        const emails = new Set();
        const phoneNumbers = new Set();
        const secondaryContactIds = [];
        if (primaryContact?.email) {
            emails.add(primaryContact.email);
        }
        if (primaryContact?.phoneNumber) {
            phoneNumbers.add(primaryContact.phoneNumber);
        }
        for (let i = 0; i < secondaryContact.length; i++){ // populating secondary contact details
            emails.add(secondaryContact[i].email);
            phoneNumbers.add(secondaryContact[i].phoneNumber);
            secondaryContactIds.push(secondaryContact[i].id);
        }
        const data = {
            contact: {
                primaryContactId: primaryContact?.id,
                emails: Array.from(emails),
                phoneNumbers: Array.from(phoneNumbers),
                secondaryContactIds: Array.from(secondaryContactIds)
            }
    }
        return res.status(200).json({
            message: "Updated Records",
            data
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            error: error
        })
    }
}
const putIdentify = async(req:Request, res:Response) => { // endpoint that performs primary contacts turn into secondary
    try {
        const { phoneNumber, email } = req.body;
        const primaryContact = await prisma.contact.findMany({
            where: {
                OR: [
                    { phoneNumber },
                    { email }
                ],
                linkPrecedence: "primary"
            }
        });
        console.log("primary contact",primaryContact)
        const date = new Date();
        if (primaryContact.length) { // making the 2nd row secondary using 1st row primary id as per the data received in body
            const contact = await prisma.contact.update(
                {
                    where: {
                        id: primaryContact[1].id
                    },
                    data: {
                    linkedId: primaryContact[0].id,
                    linkPrecedence: "secondary",
                    updatedAt: date
                },
            })
            console.log("updated contact",contact);
        }
        const secondaryContact = await prisma.contact.findMany({
            where: {
                linkedId: primaryContact[0].id,
                linkPrecedence: "secondary"
            }
        });
        const emails = new Set();
        const phoneNumbers = new Set();
        const secondaryContactIds = [];
        if (primaryContact[0]?.email) {
            emails.add(primaryContact[0].email);
        }
        if (primaryContact[0]?.phoneNumber) {
            phoneNumbers.add(primaryContact[0].phoneNumber);
        }
        for (let i = 0; i < secondaryContact.length; i++){
            emails.add(secondaryContact[i].email);
            phoneNumbers.add(secondaryContact[i].phoneNumber);
            secondaryContactIds.push(secondaryContact[i].id);
        }
        const data = {
            contact: {
                primaryContactId: primaryContact[0].id,
                emails: Array.from(emails),
                phoneNumbers: Array.from(phoneNumbers),
                secondaryContactIds: Array.from(secondaryContactIds)
            }
    }
        return res.status(200).json({
            message: "Updated Records",
            data
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            error: error
        })
    }
}


export {
    getIdentify,
    postIdentify,
    deleteIdentify,
    putIdentify
}