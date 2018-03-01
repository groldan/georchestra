/*
 * Copyright (C) 2009-2017 by the geOrchestra PSC
 *
 * This file is part of geOrchestra.
 *
 * geOrchestra is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option)
 * any later version.
 *
 * geOrchestra is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * geOrchestra.  If not, see <http://www.gnu.org/licenses/>.
 */

package org.georchestra.console.ws.backoffice.roles;

import java.util.List;

import org.georchestra.console.ds.ProtectedUserFilter;
import org.georchestra.console.dto.Group;
import org.georchestra.console.dto.GroupSchema;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Returns the list of users / roles membership.
 *
 * @author Mauricio Pazos
 *
 */

final class GroupListResponse {

	private List<Group> roleList;
	private ProtectedUserFilter filter;

	public GroupListResponse(List<Group> list, ProtectedUserFilter filter) {
		this.roleList = list;
		this.filter = filter;
	}
	
	public JSONArray toJsonArray() throws JSONException {
		JSONArray jsonGroupArray = new JSONArray();
    	for (Group role: this.roleList) {

    		JSONObject jsonGroup = new JSONObject();

    		jsonGroup.put(GroupSchema.COMMON_NAME_KEY, role.getName());

    		jsonGroup.put(GroupSchema.DESCRIPTION_KEY, role.getDescription());

    		// adds the list of users
    		List<String> list = filter.filterStringList(role.getUserList());

    		JSONArray membersArray = new JSONArray();

    		for(String userUid: list)
    			membersArray.put(userUid);

    		jsonGroup.put("users", membersArray);

    		jsonGroupArray.put(jsonGroup);
		}
		return jsonGroupArray;
	}

}
