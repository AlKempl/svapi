import json
from pymongo import MongoClient


def save_person_data_into_db(json_data, db):
    try:
        dict_data = json.loads(json_data)
        person = db.person
        person_data = {
            'first_name': dict_data["first_name"],
            'last_name':  dict_data["last_name"],
            'id_person':  dict_data["id"],
            'id_domain':  dict_data["domain"],
            'bdate':      dict_data["bdate"],
            'city':       dict_data["city"]["title"],
            'country':    dict_data["country"]["title"],
            'sex':        dict_data["sex"],
            'nickname':   dict_data["nickname"],
            'is_closed':  dict_data["is_closed"],
            'can_access_closed': dict_data["can_access_closed"]
        }
        count = person.update_one({'id_person': dict_data["id"]}, {'$set': {'id_person': dict_data["id"]}})
        print(count.matched_count)
        if count.matched_count == 0:
            person.insert_one(person_data)
        elif count.matched_count > 0:
            person.delete_many({'id_person': dict_data["id"]})
            person.insert_one(person_data)
    except Exception as err:
        print("Couldn't save into person table: {}".format(err))


def save_face_and_url_into_db(json_data, db):
    try:
        dict_data = json.loads(json_data)
        face = db.face
        face_dict = {}
        for x in dict_data["photos"]:
            face_dict[x["url"]] = x["vector_dots_face"]
        for url, dots_face in face_dict.items():
            face_data = {
                'id_person':  dict_data["id"],
                'vector_dots_face': dots_face,
                'url_photo': url
            }
            face.insert_one(face_data)
    except Exception as err:
        print("Couldn't save into face table: {}".format(err))


# Returns the established connection to the database. It will need to be transferred to all storage functions
def connect_to_host():
    try:
        client = MongoClient('mongodb://svapi:27017/')
        return client.svapi
    except Exception as err:
        print("Couldn't connect to host. Try again: ".format(err))


def find_person(db, id_person):
    try:
        return db.person.find_one({'id_person': id_person})
    except Exception as err:
        print("Couldn't find person into person table : {}".format(err))
