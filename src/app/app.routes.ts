import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomepageAdminComponent } from './pages/homepage-admin/homepage-admin.component';
import { RegisterComponent } from './pages/register/register.component';
import { HomepageUserComponent } from './pages/homepage-user/homepage-user.component';
import { HomepageMainComponent } from './pages/homepage-main/homepage-main.component';
import { HomeFollowComponent } from './pages/home-follow/home-follow.component';
import { ProfileUserComponent } from './pages/profile-user/profile-user.component';
import { CreatePostComponent } from './pages/create-post/create-post.component';
import { CategoryPageComponent } from './pages/category-page/category-page.component';
import { NotificationUserComponent } from './pages/notification-user/notification-user.component';
import { DetailPostComponent } from './pages/detail-post/detail-post.component';
import { EditprofileUserComponent } from './pages/editprofile-user/editprofile-user.component';
import { ProfileuserAdminComponent } from './pages/profileuser-admin/profileuser-admin.component';
import { ViewUserComponent } from './pages/view-user/view-user.component';
import { UserListAdminComponent } from './pages/user-list-admin/user-list-admin.component';
import { SearchUsersComponent } from './pages/search-users/search-users.component';
import { UserBanComponent } from './pages/user-ban/user-ban.component';
import { STestComponent } from './pages/s-test/s-test.component';
import { CategorynotUserComponent } from './pages/categorynot-user/categorynot-user.component';
import { SearchMainComponent } from './pages/search-main/search-main.component';
import { ViewuserMainComponent } from './pages/viewuser-main/viewuser-main.component';
import { SearctpostMainComponent } from './pages/searctpost-main/searctpost-main.component';
import { UserCosmeticsComponent } from './pagecat/user-cosmetics/user-cosmetics.component';
import { UserFashionComponent } from './pagecat/user-fashion/user-fashion.component';
import { UserFoodComponent } from './pagecat/user-food/user-food.component';
import { UserSkincareComponent } from './pagecat/user-skincare/user-skincare.component';
import { UserHealthComponent } from './pagecat/user-health/user-health.component';
import { UserTravelComponent } from './pagecat/user-travel/user-travel.component';
import { CategoryMainComponent } from './pagecat/category-main/category-main.component';
import { ChatUserComponent } from './pages/chat-user/chat-user.component';
import { NotiAddminComponent } from './pages/noti-addmin/noti-addmin.component';





export const routes: Routes = [

    {path: '', component: HomepageMainComponent},
    {path: 'login', component: LoginComponent},
    {path: 'register', component: RegisterComponent},
    {path: 'HomepageAdmin', component: HomepageAdminComponent},
    {path: 'HomepageUser', component: HomepageUserComponent},
    {path: 'Homepagefollow', component: HomeFollowComponent},
    {path: 'Notification_user', component: NotificationUserComponent},
    {path: 'ProfileUser', component: ProfileUserComponent},
    {path: 'CreatePost', component: CreatePostComponent},
    {path: 'category', component: CategoryPageComponent},
    {path: 'detail_post', component: DetailPostComponent},
    {path: 'editprofile', component: EditprofileUserComponent},
    {path: 'view_user/:userId', component: ViewUserComponent},
    {path: 'profileuserAdmin', component: ProfileuserAdminComponent},
    {path: 'userlist', component: UserListAdminComponent},
    {path: 'search_users', component: SearchUsersComponent},
    {path: 'userban', component: UserBanComponent},
    {path: 'stest', component: STestComponent},
    {path: 'category_main', component: CategorynotUserComponent},
    {path: 'search_main', component: SearchMainComponent},
    {path: 'viewuser_main', component: ViewuserMainComponent},
    {path: 'searchpost_main', component: SearctpostMainComponent},
    {path: 'Post_Cosmetics', component: UserCosmeticsComponent},
    {path: 'Post_Fashion', component: UserFashionComponent},
    {path: 'Post_Food', component: UserFoodComponent},
    {path: 'Post_Skincare', component: UserSkincareComponent},
    {path: 'Post_Health', component: UserHealthComponent},
    {path: 'Post_Travel', component: UserTravelComponent},
    {path: 'Cat_main/:cat_id', component: CategoryMainComponent},
    {path: 'chat', component: ChatUserComponent},
    {path: 'noti_addmin', component: NotiAddminComponent}
];
