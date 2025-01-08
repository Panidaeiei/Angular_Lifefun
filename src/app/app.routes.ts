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
import { EditprofileUserComponent } from './pages/editprofile-user/editprofile-user.component';

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
    {path: 'EditProfile', component: EditprofileUserComponent}
];
