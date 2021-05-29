# -*- coding: utf-8 -*-
import vk_requests
import os
import requests
import time
import logging
import subprocess
import os.path
import sys
import webbrowser as wb
import asyncio
import traceback
import multiprocessing as mp
from concurrent.futures import ALL_COMPLETED
import json
from urllib.parse import parse_qs
from datetime import datetime
from save_into_db import*
from requests.packages.urllib3.exceptions import InsecureRequestWarning
'''Since an older version of requests is used, a warning occurs:
    /home/support/.local/lib/python3.6/site-packages/requests/packages/urllib3/connectionpool.py:843:
    InsecureRequestWarning: Unverified HTTPS request is being made.
    Adding certificate verification is strongly advised.
    See: https://urllib3.readthedocs.io/en/latest/advanced-usage.html#ssl-warnings
In order to avoid this, warnings were disabled, see the article:
     https://fooobar.com/questions/49820/suppress-insecurerequestwarning-unverified-https-request-is-being-made-in-python26
'''
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
# path options
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

logger = logging.getLogger(__name__)
logger.setLevel(logging.ERROR)

f_handler = logging.FileHandler(filename='Log/NewLog.log')
f_handler.setLevel(logging.ERROR)
f_format = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
f_handler.setFormatter(f_format)
logger.addHandler(f_handler)


# token receive function
def get_access_token(app_id):
    if os.listdir('.').count('access_token.dat'):
        r = open('access_token.dat')
        access_token = r.read()
        r.close()

    else:
        auth_url = ("https://oauth.vk.com/authorize?client_id={app_id}&display=page&redirect_uri="
                    "https://oauth.vk.com/blank.html&scope="
                    "friends,photos,audio,video,docs,"
                    "notes,wall,groups, offline"
                    "&response_type=token&v=5.92&state=42".format(app_id=app_id))
        wb.open_new_tab(auth_url)
        redirected_url = input("Paste here url you were redirected:\n")
        aup = parse_qs(redirected_url)
        aup['access_token'] = aup.pop('https://oauth.vk.com/blank.html#access_token')
        s = open('access_token.dat', 'w')
        s.write(aup['access_token'][0])
        s.close()
        access_token = aup['access_token'][0]
    return access_token


def get_vector(url):
    # save file
    proxies = {'https': ''}
    ufr = requests.get(url, proxies=proxies)
    image_name = url.split('/')[-1]
    with open(image_name, 'wb') as f:
        f.write(ufr.content)

    # subprocess call
    args = ['docker', 'exec', 'openface', '/bin/bash', '-c',
            'cd /svapi/scrapper && python ./features_getter.py --img ' + image_name]

    process = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, encoding='utf-8')

    if process.returncode != 0:
        # some stupid thing, but it's work :)
        # good practice – find a error code, and return this error
        if process.stderr.find('Unable to find a face:'):
            logger.info('Unable to find a face: {}'.format(url))
        os.remove(image_name)
        return None

    features = list(map(float, process.stdout[1:-2].split()))
    os.remove(image_name)

    return {'vector_dots_face': features, 'url': url}


def form_json(api, user_info):
    time.sleep(0.4)
    if not isinstance(user_info, dict):
        user_id = user_info
        user = api.users.get(user_ids=user_id,
                             fields=['sex', 'bdate', 'city', 'country', 'domain', 'nickname', 'connections'])[0]
        if user.setdefault('deactivated') is not None:
            logger.info('User https://vk.com/id' + user_id + ' deactivated')
            return 'deactivated'
    else:
        user_id = user_info['id']
        user = user_info
        if user.setdefault('deactivated') is not None:
            logger.info('User https://vk.com/id' + user_id + ' deactivated')
            return 'deactivated'
    if user['is_closed']:
        user.update({'photos': []})
        return json.dumps(user)

    photo = api.photos.get(owner_id=user_id, album_id='profile', count=100, photo_sizes=1)['items']

    # for different types of data acquisition, some basic data were prepared
    # this is a list with a URL and a function that adds a vector to the list

    ls_urls = []
    for i in range(len(photo)):
        ls_urls.append(photo[i]['sizes'][6]['url'] if len(photo[i]['sizes']) > 6 else photo[i]['sizes'][-1]['url'])

    def add_vector(url, photo_ls):
        face_vector = get_vector(url)
        if face_vector is not None:
            photo_ls.append(face_vector)

    # synchronous
    start = time.time()
    logger.info('Start synchronous')
    photo_list = []

    for i in range(len(photo)):
        add_vector(ls_urls[i], photo_list)

    # total_synchronous = (time.time() - start)
    logger.info('End synchronous')
    # print('Synchronous: --- %s seconds ---' % total_synchronous)

    # asynchronous
    # async def add_vector1(url, photo_ls):
    #     face_vector = get_vector(url)
    #     if face_vector is not None:
    #         photo_ls.append(face_vector)
    #
    # logger.info('Start asynchronous')
    # start = time.time()
    # photo_list1 = []
    #
    # async def asynchronous():
    #     tasks = [asyncio.ensure_future(add_vector1(ls_urls[j], photo_list1) for j in range(len(ls_urls)))]
    #     done, pending = await asyncio.wait(tasks, return_when=ALL_COMPLETED)
    #     print(done.pop().result())
    #     for tasks in done:
    #         try:
    #             tasks.cancel()
    #         except:
    #             logger.error("Unexpected error: {}".format(traceback.format_exc()))
    #
    # ioloop = asyncio.get_event_loop()
    # ioloop.run_until_complete(asynchronous())
    # ioloop.close()
    #
    # total_asynchronous = (time.time() - start)
    # logger.info('End asynchronous')
    # print('Asynchronous: --- %s seconds ---' % total_asynchronous)
    # print('Total difference asynchronous: --- %s seconds ---' % (total_synchronous - total_asynchronous))

    # # multiprocessing
    # logger.info('Start multiprocessing')
    # start = time.time()
    # photo_list2 = []
    # const = 10
    # workers = []
    # for j in range(0, len(ls_urls), const):
    #     for i in range(const):
    #         temp = i + const*(j//const)
    #         if temp >= len(ls_urls):
    #             break
    #         t = mp.Process(target=add_vector(ls_urls[temp], photo_list2), args=(temp,))
    #         workers.append(t)
    #         t.start()
    #
    # total_multiprocessing = (time.time() - start)
    # logger.info('End multiprocessing')
    # print('Multiprocessing: --- %s seconds ---' % total_multiprocessing)
    # print('Total difference multiprocessing: --- %s seconds ---' % (total_synchronous - total_multiprocessing))

    # update data
    bdate = None if user.setdefault('bdate') is None else str(datetime.strptime(user['bdate'], '%d.%m.%Y')) \
        if len(user['bdate'].split('.')) == 3 else str(datetime.strptime(user['bdate'], '%d.%m'))
    user.update({'bdate': bdate})
    sex = 'female' if user['sex'] == 1 else 'male' if user['sex'] == 2 else None
    user.update({'sex': sex})
    nickname = user['nickname'] if user['nickname'] else None
    user.update({'nickname': nickname})
    user.update({'photos': photo_list})

    return json.dumps(user)


def get_users_from(api, country='', region='', city='', university='', university_faculty='', sex=0):

    def get_id(ls, word):
        return list(filter(lambda x: x['title'] == word, ls))

    # country
    country_id = 0
    if country != '':
        country_id = get_id(api.database.getCountries(need_all=1, count=1000)['items'], country)[0]['id']
        # print(country_id)
        # countries = api.database.getCountries(need_all=1, count=1000)['items']
        # country_id = list(filter(lambda x: x['title'] == country, countries))[0]['id']

        # print(country, country_id)

    # region
    region_id = 0
    if country != '' and region != '':
        region_id = get_id(api.database.getRegions(country_id=country_id, count=1000)['items'], region)[0]['id']

        # print(region, region_id)

    # city
    city_id = 0
    if country != '' and region != '' and city != '':
        time.sleep(1)
        city_count = api.database.getCities(need_all=1, country_id=country_id, region_id=region_id, count=1000)['count']
        city_id = -1
        for i in range(0, city_count, 1000):
            city_id = get_id(api.database.getCities(need_all=1, country_id=country_id,
                                                    region_id=region_id, count=1000, offset=i)['items'],
                             city)
            if city_id:
                city_id = city_id[0]['id']
                break

    # universities
    university_id = 0
    if country != '' and region != '' and city != '' and university != '':
        university_id = api.database.getUniversities(q=university, country_id=country_id,
                                                     city_id=city_id, count=100)['items'][0]['id']

    # print(university_id)
    university_faculty_id = 0
    if country != '' and region != '' and city != '' and university != '' and university_faculty != '':
        university_faculty_id = get_id(api.database.getFaculties(university_id=university_id, count=1000)['items'],
                               university_faculty)[0]['id']

    print(university_faculty_id)
    users = api.users.search(country=country_id, city=city_id, count=1000, university=university_id, sex=sex,
                             fields=['sex', 'bdate', 'city', 'country', 'domain', 'nickname', 'connections'])
    return users


def save_to_db(api, users_list):
    for i in range(len(users_list['items'])):
        try:
            db = connect_to_host()

            if find_person(db, users_list['items'][i]['id']) is None:
                js = form_json(api, users_list['items'][i])
                save_person_data_into_db(js, db)
                save_face_and_url_into_db(js, db)
            else:
                logger.info('The person {} is already in the database!'.format(users_list['items'][i]['id']))
        except Exception:
            logging.exception(Exception)
            continue


def main():

    logger.info("Program started")

    # proxies = {
    #     'http': 'http://10.10.0.50:3128',
    #     'https': 'http://10.10.0.50:3128'
    # }

    proxies = {'https': 'socks5://green:1080'}

    app_id = 7354130
    access_token = get_access_token(app_id)
    api = vk_requests.create_api(service_token=access_token,
                                 http_params={'timeout': 120, 'verify': False, 'proxies': proxies})
    # # test request
    # r1 = requests.get('https://ifconfig.co', proxies=proxies)
    # print(r1.text)
    # print(r1)

    # # test cases
    # print(form_json(api, 586715630))
    # # print()
    # print(form_json(api, 586715630))
    # print(form_json(api, 34804388))
    # print(form_json(api, 509260206))
    # users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', sex=1)
    # print(form_json(api, users['items'][0]['id']))

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', sex=1)
    save_to_db(api, users)
    print('1: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', sex=2)
    save_to_db(api, users)
    print('2: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ', sex=1)
    save_to_db(api, users)
    print('3: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ', sex=2)
    save_to_db(api, users)
    print('4: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ДГТУ', sex=1)
    save_to_db(api, users)
    print('5: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ДГТУ', sex=2)
    save_to_db(api, users)
    print('6: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'РИНХ', sex=1)
    save_to_db(api, users)
    print('7: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'РИНХ', sex=2)
    save_to_db(api, users)
    print('8: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Институт математики, механики и компьютерных наук', sex=1)
    save_to_db(api, users)
    print('9: done')
    time.sleep(1)
    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Институт математики, механики и компьютерных наук', sex=2)
    save_to_db(api, users)
    print('10: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Факультет биологических наук (Академия биологии и биотехнологии)', sex=1)
    save_to_db(api, users)
    print('11: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Факультет биологических наук (Академия биологии и биотехнологии)', sex=2)
    save_to_db(api, users)
    print('12: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Институт высоких технологий и пьезотехники', sex=1)
    save_to_db(api, users)
    print('13: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Институт высоких технологий и пьезотехники', sex=2)
    save_to_db(api, users)
    print('14: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Институт наук о Земле', sex=1)
    save_to_db(api, users)
    print('15: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Институт наук о Земле', sex=2)
    save_to_db(api, users)
    print('16: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Институт истории и международных отношений', sex=1)
    save_to_db(api, users)
    print('17: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Институт истории и международных отношений', sex=2)
    save_to_db(api, users)
    print('18: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Академия психологии и педагогики', sex=1)
    save_to_db(api, users)
    print('19: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Академия психологии и педагогики', sex=2)
    save_to_db(api, users)
    print('20: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Институт философии и социально-политических наук', sex=1)
    save_to_db(api, users)
    print('21: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Институт философии и социально-политических наук', sex=2)
    save_to_db(api, users)
    print('22: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Химический факультет', sex=1)
    save_to_db(api, users)
    print('23: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Химический факультет', sex=2)
    save_to_db(api, users)
    print('24: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Юридический факультет', sex=1)
    save_to_db(api, users)
    print('25: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Юридический факультет', sex=2)
    save_to_db(api, users)
    print('26: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Факультет технологии, изобразительного искусства и профессионального образования', sex=1)
    save_to_db(api, users)
    print('27: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Факультет технологии, изобразительного искусства и профессионального образования', sex=2)
    save_to_db(api, users)
    print('28: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Физический факультет', sex=1)
    save_to_db(api, users)
    print('29: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Физический факультет', sex=2)
    save_to_db(api, users)
    print('30: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Институт филологии, журналистики и межкультурной коммуникации', sex=2)
    save_to_db(api, users)
    print('31: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Институт филологии, журналистики и межкультурной коммуникации', sex=2)
    save_to_db(api, users)
    print('32: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Факультет изобразительного искусства', sex=1)
    save_to_db(api, users)
    print('33: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Факультет изобразительного искусства', sex=2)
    save_to_db(api, users)
    print('34: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Экономический факультет', sex=1)
    save_to_db(api, users)
    print('35: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Экономический факультет', sex=2)
    save_to_db(api, users)
    print('36: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Факультет экономики, управления и права', sex=1)
    save_to_db(api, users)
    print('37: done')
    time.sleep(1)

    users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
                           'Факультет экономики, управления и права', sex=2)
    save_to_db(api, users)
    print('38: done')
    time.sleep(1)

    # r = 'Факультет изобразительного искусства' \
    #     'Экономический факультет' \
    #     'Факультет экономики, управления и права' \
    #     'Академия физической культуры и спорта' \
    #     'Факультет социально-исторического образования' \
    #     'Факультет повышения квалификации и профессиональной переподготовки работников образования' \
    #     'Факультет естественнонаучного и математического образования' \
    #     'Факультет военного обучения' \
    #     'Высшая школа бизнеса' \
    #     'Институт права и управления' \
    #     'Институт по переподготовке и повышению квалификации преподавателей гуманитарных и социальных наук'
    # print(r.split('\n')[0])
    # users = get_users_from(api, 'Россия', 'Ростовская область', 'Ростов-на-Дону', 'ЮФУ',
    #                                               r.split('\n')[0], sex=2)

    logger.info("Program end")

        
if __name__ == "__main__":
    main()
